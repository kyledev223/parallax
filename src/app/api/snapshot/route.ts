import { getSnapshot } from "@/lib/data";

/** Normalized quotes for every curated pair. Same cached data the pages render. */
export async function GET() {
  const snapshot = await getSnapshot();
  return Response.json(snapshot, {
    headers: { "cache-control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
