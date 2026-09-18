import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import ts from "typescript";
import sharp from "sharp";

const require = createRequire(import.meta.url);
async function moduleUrl(path, replacements = {}) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  let { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  for (const [specifier, url] of Object.entries(replacements)) outputText = outputText.replaceAll(`"${specifier}"`, JSON.stringify(url));
  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
const bookingUrl = await moduleUrl("../src/lib/booking.ts");
const requestUrl = await moduleUrl("../src/app/api/booking/request.ts");
const imagesUrl = await moduleUrl("../src/app/api/booking/images.ts", {
  "@/lib/booking": bookingUrl, sharp: pathToFileURL(require.resolve("sharp")).href,
});
const { prepareEmailAttachments } = await import(imagesUrl);
const { readBookingForm, validateRequestHeaders, MAX_REQUEST_BYTES } = await import(requestUrl);
const { POST } = await import(await moduleUrl("../src/app/api/booking/route.ts", {
  "@/lib/booking": bookingUrl,
  "@/lib/site": await moduleUrl("../src/lib/site.ts"),
  "./images": imagesUrl,
  "./request": requestUrl,
}));

function form() {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    submissionId: "security-test-123456", name: "Local Test", email: "test@example.com",
    workType: "tattoo", placement: "arm", size: "3 inches", designType: "custom",
    design: "flowers", budget: "$300", availability: "October", is18: "true",
  })) data.set(key, value);
  return data;
}
function request(data = form(), headers = {}) {
  return new Request("https://example.com/api/booking", {
    method: "POST", body: data, headers: { origin: "https://example.com", ...headers },
  });
}
function fixture() {
  return sharp({ create: { width: 20, height: 15, channels: 3, background: "#aaaaaa" } });
}

for (const format of ["jpeg", "png", "webp"]) {
  test(`${format} bytes are decoded into a bounded, generated-name JPEG`, async () => {
    const bytes = await fixture().toFormat(format).toBuffer();
    const attachments = await prepareEmailAttachments([new File([bytes], `photo.${format}`, { type: `image/${format}` })]);
    assert.equal(attachments[0].filename, "reference-1.jpg");
    const output = Buffer.from(attachments[0].content, "base64");
    const metadata = await sharp(output).metadata();
    assert.equal(metadata.format, "jpeg");
    assert.equal(metadata.width, 20);
    assert.equal(metadata.height, 15);
    assert.ok(output.length < 2.5 * 1024 * 1024);
  });
}

test("spoofed, truncated, mismatched and unsupported images are rejected", async () => {
  const jpeg = await fixture().jpeg().toBuffer();
  const files = [
    new File(["not an image"], "fake.jpg", { type: "image/jpeg" }),
    new File([jpeg.subarray(0, 20)], "truncated.jpg", { type: "image/jpeg" }),
    new File([jpeg], "mismatch.png", { type: "image/png" }),
    new File([jpeg], "photo.html", { type: "image/jpeg" }),
    new File(['<svg xmlns="http://www.w3.org/2000/svg"></svg>'], "fake.jpg", { type: "image/jpeg" }),
  ];
  for (const file of files) await assert.rejects(prepareEmailAttachments([file]), undefined, file.name);
});

test("email copies strip EXIF and trailing payloads", async () => {
  const jpeg = await fixture().withExif({ IFD0: { Artist: "PRIVATE_METADATA" } }).jpeg().toBuffer();
  const marked = Buffer.concat([jpeg, Buffer.from("TRAILING_PAYLOAD")]);
  const [attachment] = await prepareEmailAttachments([new File([marked], "photo.jpg", { type: "image/jpeg" })]);
  const output = Buffer.from(attachment.content, "base64");
  assert.equal((await sharp(output).metadata()).exif, undefined);
  assert.equal(output.includes(Buffer.from("PRIVATE_METADATA")), false);
  assert.equal(output.includes(Buffer.from("TRAILING_PAYLOAD")), false);
});

test("images above the pixel limit are rejected", async () => {
  const bytes = await sharp({ create: { width: 4001, height: 4001, channels: 3, background: "white" } }).png().toBuffer();
  await assert.rejects(prepareEmailAttachments([new File([bytes], "huge.png", { type: "image/png" })]));
});

test("missing, foreign, malformed and protocol-mismatched origins are rejected", () => {
  for (const origin of ["", "null", "https://attacker.example", "http://example.com"]) {
    assert.throws(() => validateRequestHeaders(request(form(), { origin })), { status: 403 });
  }
  const missing = request();
  missing.headers.delete("origin");
  assert.throws(() => validateRequestHeaders(missing), { status: 403 });
  assert.throws(() => validateRequestHeaders(request(form(), { "sec-fetch-site": "cross-site" })), { status: 403 });
  assert.doesNotThrow(() => validateRequestHeaders(request()));
});

test("wrong content type and excessive declared body length are rejected early", () => {
  assert.throws(() => validateRequestHeaders(request(form(), { "content-type": "application/json" })), { status: 415 });
  assert.throws(() => validateRequestHeaders(request(form(), { "content-length": String(MAX_REQUEST_BYTES + 1) })), { status: 413 });
});

test("multipart form is parsed within the total body limit", async () => {
  const data = await readBookingForm(request());
  assert.equal(data.get("name"), "Local Test");
});

test("actual streamed bytes are limited even without Content-Length", async () => {
  let cancelled = false;
  const stream = new ReadableStream({
    pull(controller) { controller.enqueue(new Uint8Array(1024 * 1024)); },
    cancel() { cancelled = true; },
  });
  const req = new Request("https://example.com/api/booking", {
    method: "POST", body: stream, duplex: "half",
    headers: { "content-type": "multipart/form-data; boundary=test" },
  });
  await assert.rejects(readBookingForm(req), { status: 413 });
  assert.equal(cancelled, true);
});

test("malformed multipart data produces a safe error", async () => {
  await assert.rejects(readBookingForm(request("not multipart", { "content-type": "multipart/form-data; boundary=test" })), { status: 400 });
});

function mockEmail(t, responses = [200, 200]) {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    calls.push(JSON.parse(options.body));
    return new Response("{}", { status: responses[calls.length - 1] ?? 200 });
  });
  const oldKey = process.env.RESEND_API_KEY;
  const oldFrom = process.env.BOOKING_FROM_EMAIL;
  process.env.RESEND_API_KEY = "local-test-placeholder";
  process.env.BOOKING_FROM_EMAIL = "test@example.com";
  t.after(() => {
    if (oldKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = oldKey;
    if (oldFrom === undefined) delete process.env.BOOKING_FROM_EMAIL; else process.env.BOOKING_FROM_EMAIL = oldFrom;
  });
  return calls;
}

test("the endpoint rejects forged photos before any email call", async (t) => {
  const calls = mockEmail(t);
  const data = form();
  data.append("images", new File(["not image bytes"], "fake.jpg", { type: "image/jpeg" }));
  const response = await POST(request(data));
  assert.equal(response.status, 400);
  assert.ok((await response.json()).fieldErrors.images);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(calls.length, 0);
});

test("the endpoint sends sanitized copies and a separate confirmation", async (t) => {
  const calls = mockEmail(t);
  const data = form();
  data.append("images", new File([await fixture().png().toBuffer()], "original.png", { type: "image/png" }));
  const response = await POST(request(data));
  assert.deepEqual(await response.json(), { success: true, confirmationSent: true });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].attachments[0].filename, "reference-1.jpg");
  assert.equal(calls[1].attachments, undefined);
});

test("confirmation failure does not erase inquiry success", async (t) => {
  mockEmail(t, [200, 503]);
  t.mock.method(console, "warn", () => {});
  assert.deepEqual(await (await POST(request())).json(), { success: true, confirmationSent: false });
});

test("provider response bodies are not copied into logs or user errors", async (t) => {
  mockEmail(t);
  t.mock.method(globalThis, "fetch", async () => new Response("PRIVATE_PROVIDER_DATA", { status: 400 }));
  const logs = [];
  t.mock.method(console, "error", (message) => logs.push(message));
  const response = await POST(request());
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes("PRIVATE_PROVIDER_DATA"), false);
  assert.equal(logs.join().includes("PRIVATE_PROVIDER_DATA"), false);
});

test("baseline security headers are applied without claiming a strict script policy", async () => {
  const { default: config } = await import(await moduleUrl("../next.config.ts"));
  const [{ source, headers }] = await config.headers();
  assert.equal(source, "/:path*");
  const values = Object.fromEntries(headers.map(({ key, value }) => [key, value]));
  assert.equal(values["X-Content-Type-Options"], "nosniff");
  assert.equal(values["X-Frame-Options"], "DENY");
  assert.match(values["Content-Security-Policy"], /frame-ancestors 'none'/);
  assert.doesNotMatch(values["Content-Security-Policy"], /unsafe-inline|unsafe-eval/);
  assert.equal(config.poweredByHeader, false);
});
