import "server-only";
import { get, put } from "@vercel/blob";
import { parseTokenRecord, type TokenRecord } from "./renewal";

export function hasTokenStore() { return Boolean(process.env.BLOB_READ_WRITE_TOKEN); }
function pathname() {
  const id = process.env.INSTAGRAM_USER_ID;
  if (!id || !/^\d+$/.test(id)) throw new Error("Instagram account not configured");
  return `instagram/${id}/token.json`;
}
export async function readToken() {
  const blob = await get(pathname(), {
    access: "private", token: process.env.BLOB_READ_WRITE_TOKEN,
    useCache: false, abortSignal: AbortSignal.timeout(8000),
  });
  if (!blob) return null;
  if (blob.statusCode !== 200 || !blob.stream) throw new Error("Instagram token unavailable");
  return { record: parseTokenRecord(await new Response(blob.stream).json()), etag: blob.blob.etag };
}
export async function saveToken(record: TokenRecord, etag?: string) {
  await put(pathname(), JSON.stringify(record), {
    access: "private", token: process.env.BLOB_READ_WRITE_TOKEN,
    contentType: "application/json", addRandomSuffix: false,
    allowOverwrite: Boolean(etag), ...(etag ? { ifMatch: etag } : {}),
    cacheControlMaxAge: 60, abortSignal: AbortSignal.timeout(8000),
  });
}
export async function getInstagramToken() {
  if (hasTokenStore()) {
    const stored = await readToken();
    if (stored) {
      if (stored.record.expiresAt <= Date.now()) throw new Error("Instagram reconnection required");
      return stored.record.token;
    }
  }
  return process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
}
