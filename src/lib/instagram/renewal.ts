export type TokenRecord = { token: string; expiresAt: number; refreshedAt: number };
const DAY = 86_400_000;

export function parseTokenRecord(value: unknown): TokenRecord {
  const record = value as Partial<TokenRecord> | null;
  if (!record || typeof record.token !== "string" || !record.token.trim() ||
      typeof record.expiresAt !== "number" || !Number.isFinite(record.expiresAt) ||
      typeof record.refreshedAt !== "number" || !Number.isFinite(record.refreshedAt) ||
      record.expiresAt <= record.refreshedAt) throw new Error("Invalid stored Instagram token");
  return { token: record.token.trim(), expiresAt: record.expiresAt, refreshedAt: record.refreshedAt };
}

export async function renewToken(current: TokenRecord | null, seed: string | undefined,
  save: (record: TokenRecord) => Promise<void>, fetcher: typeof fetch = fetch, now = Date.now()) {
  if (current && current.expiresAt <= now) throw new Error("Instagram reconnection required");
  if (current && (current.expiresAt - now > 30 * DAY || now - current.refreshedAt < DAY)) {
    return { refreshed: false, expiresAt: current.expiresAt };
  }
  const token = current?.token || seed?.trim();
  if (!token) throw new Error("Instagram token not configured");
  const url = new URL("https://graph.instagram.com/refresh_access_token");
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", token);
  // Never log this URL or raw fetch errors: Meta requires the token in the query.
  const response = await fetcher(url, { cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error("Instagram refresh rejected");
  const body = await response.json();
  if (typeof body.access_token !== "string" || !body.access_token.trim() ||
      typeof body.expires_in !== "number" || !Number.isFinite(body.expires_in) || body.expires_in <= 0) {
    throw new Error("Invalid Instagram refresh response");
  }
  const record = { token: body.access_token.trim(), refreshedAt: now, expiresAt: now + body.expires_in * 1000 };
  await save(record);
  return { refreshed: true, expiresAt: record.expiresAt };
}
