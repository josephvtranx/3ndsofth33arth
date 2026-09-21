import "server-only";
import { selectInstagramPosts, type GalleryPost } from "./instagram-media";

export async function getInstagramPosts(): Promise<GalleryPost[]> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;
  if (!token || !userId || !/^\d+$/.test(userId)) return [];

  try {
    const url = new URL(`https://graph.instagram.com/v25.0/${userId}/media`);
    url.searchParams.set("fields", "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp");
    url.searchParams.set("limit", "12");
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      console.warn(`Instagram gallery unavailable (HTTP ${response.status}); using fallback images.`);
      return [];
    }
    return selectInstagramPosts(await response.json());
  } catch {
    // Do not log errors or raw responses: they can contain credentials or paging URLs.
    console.warn("Instagram gallery unavailable; using fallback images.");
    return [];
  }
}
