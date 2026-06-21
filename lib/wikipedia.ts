/**
 * Fetch a Wikipedia thumbnail via our own server-side proxy (/api/wiki-image).
 * Proxying avoids browser CORS/CSP restrictions on the Wikipedia API.
 */
export async function fetchWikipediaImage(name: string): Promise<string | null> {
  if (!name.trim()) return null;
  try {
    const res = await fetch(`/api/wiki-image?q=${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return (data?.url as string) ?? null;
  } catch {
    return null;
  }
}
