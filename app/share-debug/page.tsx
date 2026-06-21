import { headers } from 'next/headers';

export default async function ShareDebugPage() {
  const hdrs = await headers();
  const host = hdrs.get('host') ?? 'unknown';
  const proto = hdrs.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;

  const testWinner   = 'Tesla Model Y Long Range';
  const testScore    = '79';
  const testDecision = 'buying a family car';

  // ── Test 1: Wikipedia REST API direct (exact title) ──
  let wikiExactStatus = '';
  let wikiExactThumb  = '';
  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/Tesla_Model_Y_Long_Range`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    );
    wikiExactStatus = `${r.status} ${r.statusText}`;
    if (r.ok) {
      const d = await r.json();
      wikiExactThumb = d?.thumbnail?.source ?? '(no thumbnail in response)';
    }
  } catch (e) {
    wikiExactStatus = `FETCH ERROR: ${e}`;
  }

  // ── Test 2: Wikipedia REST API (canonical title) ──
  let wikiCanonStatus = '';
  let wikiCanonThumb  = '';
  try {
    const r = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/Tesla_Model_Y`,
      { headers: { Accept: 'application/json' }, cache: 'no-store' }
    );
    wikiCanonStatus = `${r.status} ${r.statusText}`;
    if (r.ok) {
      const d = await r.json();
      wikiCanonThumb = d?.thumbnail?.source ?? '(no thumbnail in response)';
    }
  } catch (e) {
    wikiCanonStatus = `FETCH ERROR: ${e}`;
  }

  // ── Test 3: Wikipedia OpenSearch ──
  let openSearchStatus = '';
  let openSearchResult = '';
  try {
    const r = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=Tesla+Model+Y+Long+Range&limit=1&namespace=0&format=json`,
      { cache: 'no-store' }
    );
    openSearchStatus = `${r.status} ${r.statusText}`;
    if (r.ok) {
      const d = await r.json();
      openSearchResult = JSON.stringify(d?.[1]) ?? '(empty)';
    }
  } catch (e) {
    openSearchStatus = `FETCH ERROR: ${e}`;
  }

  // ── Test 4: Our own /api/wiki-image endpoint ──
  let apiStatus = '';
  let apiResult = '';
  try {
    const r = await fetch(
      `${origin}/api/wiki-image?q=${encodeURIComponent(testWinner)}`,
      { cache: 'no-store' }
    );
    apiStatus = `${r.status} ${r.statusText}`;
    if (r.ok) {
      const d = await r.json();
      apiResult = JSON.stringify(d);
    }
  } catch (e) {
    apiStatus = `FETCH ERROR: ${e}`;
  }

  const lines = [
    '=== decide share-debug ===',
    `Origin: ${origin}`,
    '',
    '── Test 1: Wikipedia REST (exact: Tesla_Model_Y_Long_Range) ──',
    `Status:    ${wikiExactStatus}`,
    `Thumbnail: ${wikiExactThumb || '(none)'}`,
    '',
    '── Test 2: Wikipedia REST (canonical: Tesla_Model_Y) ──',
    `Status:    ${wikiCanonStatus}`,
    `Thumbnail: ${wikiCanonThumb || '(none)'}`,
    '',
    '── Test 3: Wikipedia OpenSearch ──',
    `Status:  ${openSearchStatus}`,
    `Titles:  ${openSearchResult || '(none)'}`,
    '',
    '── Test 4: /api/wiki-image?q=Tesla+Model+Y+Long+Range ──',
    `Status:  ${apiStatus}`,
    `Result:  ${apiResult || '(none)'}`,
    '',
    '── OG image (should load in browser) ──',
    `${origin}/api/og?winner=${encodeURIComponent(testWinner)}&score=${testScore}&decision=${encodeURIComponent(testDecision)}`,
    '',
    '── Share page (paste into opengraph.xyz) ──',
    `${origin}/share?winner=${encodeURIComponent(testWinner)}&score=${testScore}&decision=${encodeURIComponent(testDecision)}`,
  ].join('\n');

  return (
    <pre style={{ fontFamily: 'monospace', fontSize: '13px', padding: '32px', lineHeight: 1.8, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {lines}
    </pre>
  );
}
