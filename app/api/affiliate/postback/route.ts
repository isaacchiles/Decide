import { NextRequest, NextResponse } from 'next/server';

/**
 * Affiliate postback endpoint — Phase 3 stub
 *
 * CPA networks call this URL server-to-server when a conversion completes.
 * They echo back the sub-ID (our decision ID) plus payout details.
 *
 * Typical postback URL you give the network:
 *   https://yourdomain.com/api/affiliate/postback?subid={SUBID}&payout={PAYOUT}&offer={OFFER}&secret=YOUR_SECRET
 *
 * Phase 3: write to a Supabase `affiliate_conversions` table so you can
 * see which decisions/verticals actually earn — the data needed to optimize.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const secret = searchParams.get('secret');
  const subId  = searchParams.get('subid');
  const payout = searchParams.get('payout');
  const offer  = searchParams.get('offer');

  // Validate the shared secret so only your network can post back
  const expectedSecret = process.env.AFFILIATE_POSTBACK_SECRET;
  if (!expectedSecret || secret !== expectedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!subId) {
    return NextResponse.json({ error: 'Missing subid' }, { status: 400 });
  }

  // TODO Phase 3: write to affiliate_conversions table
  // const supabase = await createClient();
  // await supabase.from('affiliate_conversions').insert({
  //   decision_id: subId,
  //   offer,
  //   payout: parseFloat(payout ?? '0'),
  //   recorded_at: new Date().toISOString(),
  // });

  console.log('[affiliate/postback]', { subId, payout, offer });

  // Networks expect a 200 to acknowledge the postback
  return NextResponse.json({ ok: true });
}
