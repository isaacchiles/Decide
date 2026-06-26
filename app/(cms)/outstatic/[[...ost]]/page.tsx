import 'outstatic/outstatic.css';
import { Outstatic } from 'outstatic';
import dynamic from 'next/dynamic';

/**
 * Load OstClient client-side only (ssr: false).
 * The Outstatic dashboard reads localStorage/cookies on mount and uses
 * next-themes, both of which cause server/client HTML mismatches.
 * Disabling SSR eliminates the hydration step entirely — the component
 * is rendered fresh in the browser on every load.
 */
const OstClient = dynamic(
  () => import('outstatic/client').then((m) => ({ default: m.OstClient })),
  { ssr: false }
);

export default async function Page({
  params,
}: {
  params: { ost?: string[] };
}) {
  const { ost = [] } = params;
  const ostData = await Outstatic();
  return <OstClient ostData={ostData} params={{ ost }} />;
}
