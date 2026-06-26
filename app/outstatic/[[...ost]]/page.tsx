import 'outstatic/outstatic.css';
import { Outstatic } from 'outstatic';
import { OstClient } from 'outstatic/client';

type Props = { params: Promise<{ ost?: string[] }> };

/**
 * Outstatic CMS dashboard — accessible at /outstatic
 * Protected by GitHub OAuth (only repo collaborators can sign in).
 * Supabase middleware is bypassed for /outstatic/* (see middleware.ts).
 */
export default async function Page({ params }: Props) {
  const { ost = [] } = await params;
  const ostData = await Outstatic();
  return <OstClient ostData={ostData} params={{ ost }} />;
}
