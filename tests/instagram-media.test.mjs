import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import ts from "typescript";
const source = await readFile(new URL("../src/app/ink/instagram-media.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } });
const { selectInstagramPosts } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
const post = (day, overrides = {}) => ({ media_type: "IMAGE", media_url: "https://scontent.cdninstagram.com/photo.jpg", permalink: `https://www.instagram.com/p/post${day}/`, timestamp: `2026-09-${day}T00:00:00Z`, ...overrides });
test("selects newest three and strips private response fields", () => {
  const selected = selectInstagramPosts({ data: [post(11), post(14), post(12), post(13)], paging: { next: "secret" } });
  assert.deepEqual(selected.map(p => p.href), [14, 13, 12].map(day => `https://www.instagram.com/p/post${day}/`));
  assert.deepEqual(Object.keys(selected[0]).sort(), ["alt", "href", "src"]);
});
test("uses video thumbnails and carousel covers", () => {
  const selected = selectInstagramPosts({ data: [post(12, { media_type: "VIDEO", thumbnail_url: "https://scontent.cdninstagram.com/thumb.jpg" }), post(11, { media_type: "CAROUSEL_ALBUM" })] });
  assert.ok(selected[0].src.endsWith("thumb.jpg"));
  assert.ok(selected[1].src.endsWith("photo.jpg"));
});
test("rejects malformed data, unsafe links and videos without thumbnails", () => {
  for (const payload of [null, {}, { data: "bad" }]) assert.deepEqual(selectInstagramPosts(payload), []);
  assert.deepEqual(selectInstagramPosts({ data: [post(11, { permalink: "javascript:alert(1)" }), post(12, { media_url: "https://cdninstagram.com.evil.test/image.jpg" }), post(13, { media_type: "VIDEO" }), post(14, { timestamp: "bad" })] }), []);
});
