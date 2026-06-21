// Diagnostic page — visit /share-debug in production to verify OG config.
// Safe to leave deployed; returns plain text, no sensitive data.
import { headers } from 'next/headers';

export default async function ShareDebugPage() {
  const hdrs = await headers();
  const host = hdrs.get('host') ?? 'unknown';
  const proto = hdrs.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;

  const envAppUrl   = process.env.NEXT_PUBLIC_APP_URL   ?? '(not set)';
  const envVercelUrl = process.env.VERCEL_URL            ?? '(not set)';
  const envVercelProd = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? '(not set)';

  const testWinner   = 'Tesla Model Y';
  const testScore    = '79';
  const testDecision = 'buying a family car';

  const ogImageRelative = `/api/og?winner=${encodeURIComponent(testWinner)}&score=${testScore}&decision=${encodeURIComponent(testDecision)}`;
  const ogImageAbsolute = `${origin}${ogImageRelative}`;

  const lines = [
    '=== decide share-debug ===',
    '',
    '-- Request info --',
    `Host header:         ${host}`,
    `Proto header:        ${proto}`,
    `Inferred origin:     ${origin}`,
    '',
    '-- Environment variables --',
    `NEXT_PUBLIC_APP_URL:              ${envAppUrl}`,
    `VERCEL_URL:                       ${envVercelUrl}`,
    `VERCEL_PROJECT_PRODUCTION_URL:    ${envVercelProd}`,
    '',
    '-- What metadataBase resolves to --',
    `Value used: ${envAppUrl !== '(not set)' ? envAppUrl : envVercelProd !== '(not set)' ? `https://${envVercelProd}` : envVercelUrl !== '(not set)' ? `https://${envVercelUrl}` : 'http://localhost:3000'}`,
    '',
    '-- OG image URL test --',
    `Relative: ${ogImageRelative}`,
    `Absolute: ${ogImageAbsolute}`,
    '',
    `Fetch the absolute URL above in your browser.`,
    `It should return an image (PNG), not a redirect or error.`,
    '',
    '-- Share page test --',
    `Visit: ${origin}/share?winner=${encodeURIComponent(testWinner)}&score=${testScore}&decision=${encodeURIComponent(testDecision)}`,
    `It should return 200 OK with og:image in the <head>.`,
    `Paste that URL into https://opengraph.xyz to verify.`,
  ].join('\n');

  return (
    <pre style={{ fontFamily: 'monospace', fontSize: '13px', padding: '32px', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
      {lines}
    </pre>
  );
}
