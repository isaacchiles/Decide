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
    // Try the full title, then progressively drop the last word until we get a thumbnail.
    // e.g. "Tesla Model Y Long Range" → "Tesla Model Y Long" → "Tesla Model Y" → hit
    const words = q.trim().split(/\s+/);
    for (let len = words.length; len >= 1; len--) {
      const title = words.slice(0, len).join(' ');
      const url = await summaryThumb(title);
      if (url) return NextResponse.json({ url });
    }
  } catch (err) {
    console.error('wiki-image error:', err);
  }

  return NextResponse.json({ url: null });
}
