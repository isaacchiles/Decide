import 'outstatic/outstatic.css';
import { Outstatic } from 'outstatic';
import { OstClient } from 'outstatic/client';

/**
 * Outstatic CMS dashboard — /outstatic
 * Lives in its own (cms) route group so the root layout doesn't interfere.
 * Protected by GitHub OAuth — only repo collaborators can sign in.
 */
export default async function Page({
  params,
}: {
  params: { ost?: string[] };
}) {
  const { ost = [] } = params;
  const ostData = await Outstatic();
  return <OstClient ostData={ostData} params={{ ost }} />;
}
