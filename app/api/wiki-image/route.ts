import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/wiki-image?q=Tesla+Model+Y+Long+Range
 *
 * Fetches a Wikipedia thumbnail server-side (no CORS issues).
 * Strategy:
 *   1. Try the exact title via the REST summary API.
 *   2. Fall back to OpenSearch to find the closest article title, then fetch that.
 * Returns: { url: string } or { url: null }
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json({ url: null });

  const toTitle = (s: string) => encodeURIComponent(s.trim().replace(/ /g, '_'));

  async function summaryThumb(title: string): Promise<string | null> {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${toTitle(title)}`,
      { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.thumbnail?.source as string) ?? null;
  }

  try {
    // 1. Exact title
    const exact = await summaryThumb(q);
    if (exact) return NextResponse.json({ url: exact });

    // 2. OpenSearch fallback
    const searchRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&namespace=0&format=json`,
      { next: { revalidate: 3600 } }
    );
    if (searchRes.ok) {
      const data = await searchRes.json();
      const bestTitle: string | undefined = data?.[1]?.[0];
      if (bestTitle) {
        const fallback = await summaryThumb(bestTitle);
        if (fallback) return NextResponse.json({ url: fallback });
      }
    }
  } catch (err) {
    console.error('wiki-image error:', err);
  }

  return NextResponse.json({ url: null });
}
