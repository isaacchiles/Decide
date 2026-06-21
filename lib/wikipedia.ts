/**
 * Fetch a Wikipedia thumbnail for a given name.
 *
 * Strategy:
 *  1. Try the exact title via the REST summary API (fast, handles Wikipedia
 *     internal redirects automatically).
 *  2. If that returns no thumbnail, fall back to OpenSearch to find the
 *     closest article title, then fetch its summary.
 *
 * Returns the thumbnail source URL, or null if nothing was found.
 */
export async function fetchWikipediaImage(name: string): Promise<string | null> {
  if (!name.trim()) return null;

  const toTitle = (s: string) => encodeURIComponent(s.trim().replace(/ /g, '_'));

  // Helper: fetch REST summary and extract thumbnail
  async function summaryThumb(title: string): Promise<string | null> {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${toTitle(title)}`,
        { headers: { Accept: 'application/json' } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.thumbnail?.source as string) ?? null;
    } catch {
      return null;
    }
  }

  // 1. Try exact title (REST API follows Wikipedia redirects natively)
  const exact = await summaryThumb(name);
  if (exact) return exact;

  // 2. OpenSearch — find the closest real article title
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(name)}&limit=1&namespace=0&format=json&origin=*`
    );
    if (res.ok) {
      const data = await res.json();
      // OpenSearch returns [query, [titles], [descriptions], [urls]]
      const bestTitle: string | undefined = data?.[1]?.[0];
      if (bestTitle && bestTitle.toLowerCase() !== name.toLowerCase()) {
        return await summaryThumb(bestTitle);
      }
    }
  } catch {
    // fall through
  }

  return null;
}
