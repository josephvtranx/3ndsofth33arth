export type GalleryPost = { src: string; alt: string; href: string };

function safeUrl(value: unknown, domains: string[]): string | undefined {
  if (typeof value !== "string") return;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return;
    if (!domains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`))) return;
    return url.href;
  } catch { return; }
}

// Keep only public display fields; never pass the raw API response or paging URLs to the page.
export function selectInstagramPosts(payload: unknown): GalleryPost[] {
  if (!payload || typeof payload !== "object" || !("data" in payload) || !Array.isArray(payload.data)) return [];
  return payload.data.flatMap((item: unknown) => {
    if (!item || typeof item !== "object") return [];
    const media = item as Record<string, unknown>;
    if (!["IMAGE", "CAROUSEL_ALBUM", "VIDEO"].includes(String(media.media_type))) return [];
    const src = safeUrl(media.media_type === "VIDEO" ? media.thumbnail_url : media.media_url, ["cdninstagram.com", "fbcdn.net"]);
    const href = safeUrl(media.permalink, ["instagram.com"]);
    const timestamp = typeof media.timestamp === "string" ? Date.parse(media.timestamp) : NaN;
    if (!src || !href || !Number.isFinite(timestamp)) return [];
    const caption = typeof media.caption === "string" ? media.caption.trim().replace(/\s+/g, " ") : "";
    return [{ src, href, alt: caption ? caption.slice(0, 240) : "Tattoo work by Esther Ko", timestamp }];
  }).sort((a, b) => b.timestamp - a.timestamp).slice(0, 3)
    .map(({ src, href, alt }) => ({ src, href, alt }));
}
