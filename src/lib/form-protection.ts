import { createHmac } from "node:crypto";

const WINDOW = 3600;
const LIMIT = 5;
// One atomic operation: the counter always gets an expiry, even under concurrency.
const SCRIPT = "local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; return {n,redis.call('TTL',KEYS[1])}";

export function protectionEnabled() {
  return process.env.VERCEL_ENV === "production" || process.env.SPAM_PROTECTION_ENABLED === "true";
}
function reject(error: string, status: number, retry?: number) {
  return Response.json({ success: false, error }, { status, headers: {
    "Cache-Control": "no-store", ...(retry ? { "Retry-After": String(retry) } : {}),
  } });
}
const unavailable = () => reject("verification is temporarily unavailable. please try again shortly.", 503);

export async function protectForm(request: Request, form: FormData, action: "booking" | "waitlist") {
  if (!protectionEnabled()) return null;
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const redis = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const salt = process.env.FORM_RATE_LIMIT_SECRET;
  const hosts = process.env.TURNSTILE_ALLOWED_HOSTNAMES?.split(",").map(h => h.trim()).filter(Boolean);
  if (!secret || !redis?.startsWith("https://") || !redisToken || !salt || !hosts?.length) return unavailable();
  const token = form.get("cf-turnstile-response");
  if (typeof token !== "string" || !token || token.length > 2048) return reject("please complete the verification and try again.", 400);
  // Vercel overwrites x-forwarded-for. Do not trust this header on other hosts.
  const ip = process.env.VERCEL === "1" ? request.headers.get("x-forwarded-for")?.split(",")[0].trim() : "local";
  if (!ip) return unavailable();
  const key = "forms:ip:" + createHmac("sha256", salt).update(ip).digest("hex");
  try {
    const response = await fetch(redis, {
      method: "POST", headers: { Authorization: `Bearer ${redisToken}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", SCRIPT, "1", key, String(WINDOW)]), signal: AbortSignal.timeout(5000), cache: "no-store",
    });
    if (!response.ok) return unavailable();
    const data = await response.json();
    if (data.error || !Array.isArray(data.result) || !Number.isInteger(data.result[0]) || data.result[0] < 1 || !Number.isInteger(data.result[1]) || data.result[1] < 0) return unavailable();
    if (data.result[0] > LIMIT) return reject("too many attempts. please wait before trying again.", 429, Math.max(1, data.result[1]));
    const verified = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token }), signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!verified.ok) return unavailable();
    const result = await verified.json();
    if (result.success !== true || result.action !== action || !hosts.includes(result.hostname)) return reject("verification expired or failed. please try again.", 400);
    return null;
  } catch { return unavailable(); }
}
