import { searchLocations } from "@/lib/waitlist-data/locations.mjs";
export const runtime = "nodejs";
export async function GET(request: Request) {
 const query = new URL(request.url).searchParams.get("q") || "";
 if (query.length > 120) return Response.json({ error: "Search is too long." }, { status: 400 });
 try {
  return Response.json({ locations: await searchLocations(query) }, { headers: { "Cache-Control": "public, max-age=300" } });
 } catch { return Response.json({ error: "Location search is unavailable. Please try again." }, { status: 503 }); }
}
