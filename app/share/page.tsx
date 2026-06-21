import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

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

// The page itself just redirects to the app —
// the value is entirely in the OG meta tags above.
export default async function SharePage({ searchParams }: Props) {
  const params = await searchParams;
  // Preserve any UTM / tracking context if needed in the future
  void params;
  redirect('/');
}
