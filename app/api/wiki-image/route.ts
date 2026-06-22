import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/wiki-image?q=Tesla+Model+Y+Long+Range
 *
 * Image search strategy:
 *   1. Wikipedia REST summary API — progressive word-drop fallback
 *   2. Pexels API — keyword image search (PEXELS_API_KEY required)
 * Returns: { url: string } or { url: null }
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') ?? '';
  if (!q.trim()) return NextResponse.json({ url: null });

  // ── Normalise query ──────────────────────────────────────────────────────
  // Strip punctuation (commas, periods, etc.) and expand US state abbreviations
  // so "Charlotte, NC" → try "Charlotte North Carolina" before "Charlotte"
  const STATE_ABBRS: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
    NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina',
    ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania',
    RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
    TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington',
    WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'Washington DC',
  };

  const clean    = q.trim().replace(/[,\.;:!?]/g, '');
  const expanded = clean.replace(/\b([A-Z]{2})\b/g, (m) => STATE_ABBRS[m] ?? m);
  // Try expanded form (state abbr resolved) first, then original
  const candidates = expanded !== clean ? [expanded, clean] : [clean];

  const toTitle = (s: string) => encodeURIComponent(s.trim().replace(/ /g, '_'));

  async function wikiThumb(title: string): Promise<string | null> {
    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${toTitle(title)}`,
        { headers: { Accept: 'application/json' }, next: { revalidate: 3600 } }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return (data?.thumbnail?.source as string) ?? null;
    } catch {
      return null;
    }
  }

  // ── Step 1: Wikipedia with progressive word-drop on each candidate ───────
  for (const candidate of candidates) {
    const words = candidate.trim().split(/\s+/);
    for (let len = words.length; len >= 1; len--) {
      const title = words.slice(0, len).join(' ');
      const url = await wikiThumb(title);
      if (url) return NextResponse.json({ url });
    }
  }

  // ── Step 2: Pexels fallback ───────────────────────────────────────────────
  const pexelsKey = process.env.PEXELS_API_KEY;
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(clean)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: pexelsKey }, next: { revalidate: 3600 } }
      );
      if (res.ok) {
        const data = await res.json();
        const photo = data?.photos?.[0];
        const url: string | undefined = photo?.src?.large ?? photo?.src?.medium;
        if (url) return NextResponse.json({ url });
      }
    } catch (err) {
      console.error('pexels fallback error:', err);
    }
  }

  return NextResponse.json({ url: null });
}
