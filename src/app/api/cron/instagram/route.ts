import { timingSafeEqual } from "node:crypto";
import { hasTokenStore, readToken, saveToken } from "@/lib/instagram/token-store";
import { renewToken } from "@/lib/instagram/renewal";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const actual = Buffer.from(request.headers.get("authorization") || "");
  const expected = Buffer.from(`Bearer ${secret}`);
  if (!secret || actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  if (!hasTokenStore()) return Response.json({ error: "Token storage not configured" }, { status: 503, headers });
  try {
    const stored = await readToken();
    const result = await renewToken(stored?.record ?? null, process.env.INSTAGRAM_ACCESS_TOKEN,
      (record) => saveToken(record, stored?.etag));
    return Response.json(result, { headers });
  } catch {
    console.error("Instagram renewal failed; check private storage and account authorization.");
    return Response.json({ error: "Instagram renewal failed" }, { status: 502, headers });
  }
}
