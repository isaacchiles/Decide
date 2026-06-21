import type { Metadata } from 'next';
import Link from 'next/link';

type Props = {
  searchParams: Promise<{ winner?: string; score?: string; decision?: string; img?: string }>;
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const params  = await searchParams;
  const winner   = params.winner   ?? 'a decision';
  const score    = params.score    ?? '';
  const decision = params.decision ?? '';
  const img      = params.img      ?? '';

  const title       = `I chose ${winner} — Decide`;
  const description = decision
    ? `I used Decide to help me ${decision.toLowerCase()} and landed on ${winner}${score ? ` (scored ${score}/100)` : ''}. Try it free.`
    : `I used Decide to make a weighted decision and chose ${winner}${score ? ` with a score of ${score}/100` : ''}. Try it free.`;

  const ogParams = new URLSearchParams({ winner, score });
  if (decision) ogParams.set('decision', decision);
  if (img)      ogParams.set('img', img);
  const ogImageUrl = `/api/og?${ogParams.toString()}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `I chose ${winner}` }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

// Renders real HTML so iMessage / social scrapers see OG meta tags.
// A client-side redirect is handled by the JS below — bots that don't
// run JS (scrapers) stay on this page and read the <head> tags.
export default async function SharePage({ searchParams }: Props) {
  const params   = await searchParams;
  const winner   = params.winner   ?? '';
  const score    = params.score    ?? '';
  const decision = params.decision ?? '';

  return (
    <>
      {/* Instant client-side redirect for real users — bots skip this */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace('/');`,
        }}
      />

      {/* Fallback content for bots / no-JS (never visible to normal users) */}
      <div style={{ minHeight: '100vh', background: '#F9F7F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif', padding: '40px 24px' }}>
        <div style={{ maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ marginBottom: '8px', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#52B788', fontWeight: 700 }}>
            MY CHOICE
          </div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 8px', lineHeight: 1.1 }}>
            {winner || 'A decision was made'}
          </h1>
          {score && (
            <div style={{ fontSize: '20px', color: '#2D6A4F', fontWeight: 700, marginBottom: '8px' }}>
              Score: {score}/100
            </div>
          )}
          {decision && (
            <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '0 0 32px' }}>
              {decision}
            </p>
          )}
          <Link
            href="/"
            style={{ display: 'inline-block', padding: '14px 32px', background: '#2D6A4F', color: 'white', borderRadius: '24px', textDecoration: 'none', fontSize: '15px', fontWeight: 700 }}
          >
            Make your own decision →
          </Link>
        </div>
      </div>
    </>
  );
}
