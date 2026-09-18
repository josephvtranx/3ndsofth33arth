import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { File } from "node:buffer";
import { test } from "node:test";
import ts from "typescript";

// Transpile the isolated modules with the project's existing TypeScript dependency.
async function loadModule(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const { prepareBookingImage, MAX_SOURCE_IMAGE_BYTES } = await loadModule("../src/app/booking/prepare-image.ts");
const { validateBookingForm, MAX_BOOKING_TOTAL_BYTES, MAX_BOOKING_IMAGES } = await loadModule("../src/lib/booking.ts");
const budget = Math.floor(MAX_BOOKING_TOTAL_BYTES / MAX_BOOKING_IMAGES);

function mockBrowser(t, { width = 4000, height = 3000, encodedSize = 250_000, decodeFails = false } = {}) {
  const oldDocument = globalThis.document;
  const oldDecoder = globalThis.createImageBitmap;
  const oldFile = globalThis.File;
  const calls = [];
  const bitmap = { width, height, close: () => calls.push("close") };
  const context = {
    fillRect: () => calls.push("background"),
    drawImage: () => calls.push("draw"),
  };
  const canvas = {
    width: 0, height: 0,
    getContext: () => context,
    toBlob: (resolve, type, quality) => {
      calls.push({ width: canvas.width, height: canvas.height, quality });
      resolve(encodedSize === null ? null : new Blob([new Uint8Array(encodedSize)], { type }));
    },
  };
  globalThis.File = File;
  globalThis.document = { createElement: () => canvas };
  globalThis.createImageBitmap = async () => {
    calls.push("decode");
    if (decodeFails) throw new Error("invalid image");
    return bitmap;
  };
  t.after(() => {
    globalThis.document = oldDocument;
    globalThis.createImageBitmap = oldDecoder;
    globalThis.File = oldFile;
  });
  return { calls, canvas };
}

test("a large original becomes a bounded JPEG with its aspect ratio preserved", async (t) => {
  const { calls, canvas } = mockBrowser(t);
  const original = new File([new Uint8Array(8 * 1024 * 1024)], "reference.png", { type: "image/png" });
  const prepared = await prepareBookingImage(original, budget);
  assert.equal(prepared.type, "image/jpeg");
  assert.equal(prepared.name, "reference.jpg");
  assert.ok(prepared.size <= budget);
  assert.equal(original.size, 8 * 1024 * 1024);
  assert.deepEqual(calls.slice(0, 4), ["decode", "background", "draw", { width: 2000, height: 1500, quality: 0.88 }]);
  assert.equal(calls.at(-1), "close");
  assert.equal(canvas.width, 0);
});

test("a small valid image is kept without recompressing it", async (t) => {
  const { calls } = mockBrowser(t, { width: 640, height: 480 });
  const original = new File(["image"], "small.webp", { type: "image/webp" });
  assert.equal(await prepareBookingImage(original, budget), original);
  assert.deepEqual(calls, ["decode", "close"]);
});

test("failed encoding is bounded and releases the decoded image", async (t) => {
  const { calls } = mockBrowser(t, { encodedSize: null });
  await assert.rejects(prepareBookingImage(new File(["image"], "bad.jpg"), budget), /could not be resized/);
  assert.equal(calls.filter((call) => typeof call === "object").length, 15);
  assert.equal(calls.at(-1), "close");
});

test("a corrupt photo reports a readable error", async (t) => {
  mockBrowser(t, { decodeFails: true });
  await assert.rejects(prepareBookingImage(new File(["not an image"], "corrupt.jpg"), budget), /could not be opened/);
});

test("oversized and empty originals are rejected before decoding", async (t) => {
  const { calls } = mockBrowser(t);
  await assert.rejects(prepareBookingImage(new File([], "empty.jpg"), budget), /is empty/);
  await assert.rejects(prepareBookingImage(new File([new Uint8Array(MAX_SOURCE_IMAGE_BYTES + 1)], "huge.jpg"), budget), /under 20 MB/);
  assert.deepEqual(calls, []);
});

function inquiry(images) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    submissionId: "test-submission-123456", name: "Test", email: "test@example.com",
    workType: "tattoo", placement: "arm", size: "4 x 6", designType: "custom",
    design: "botanical", budget: "$300", availability: "october 5–12", is18: "true",
  })) data.set(key, value);
  for (let i = 0; i < images; i++) data.append("images", new File([new Uint8Array(budget)], `${i}.jpg`, { type: "image/jpeg" }));
  return data;
}

test("ten prepared photos pass server validation and leave multipart headroom", async () => {
  const data = inquiry(10);
  const result = validateBookingForm(data);
  assert.equal(result.ok, true);
  assert.equal(result.images.length, 10);
  const encoded = new Request("https://example.com/api/booking", { method: "POST", body: data });
  assert.ok((await encoded.arrayBuffer()).byteLength < 4_500_000);
});

test("server rejects an eleventh photo and oversized direct uploads", () => {
  assert.equal(validateBookingForm(inquiry(11)).ok, false);
  const data = inquiry(0);
  data.append("images", new File([new Uint8Array(4 * 1024 * 1024)], "large.jpg", { type: "image/jpeg" }));
  const result = validateBookingForm(data);
  assert.equal(result.ok, false);
  assert.ok(result.fieldErrors.images);
});
