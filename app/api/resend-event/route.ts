import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resendClient } from '@/lib/resend';

/**
 * POST /api/resend-event
 *
 * Fires a decision.completed event to Resend for the authenticated user.
 * If the user exists in Resend (consented), this triggers Sequence B
 * (24hr follow-up B1 and 14-day re-engagement B2).
 *
 * If the user never consented, Resend has no record of them and the event
 * is a no-op — no email is sent.
 *
 * Called fire-and-forget from DecisionMaker.tsx after a successful save.
 *
 * Body: { winner_name, winner_score, decision_title, ai_vertical }
 */
export async function POST(req: Request) {
  if (!resendClient) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { winner_name, winner_score, decision_title, ai_vertical } = await req.json();

  // Count total completed decisions for this user.
  // Used in Resend automation conditions to gate repeat sends (B1)
  // and power re-engagement logic (B2).
  const { count } = await supabase
    .from('decisions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'complete');

  const decisions_count = count ?? 1;

  try {
    // resend.events.send() — the correct SDK method for firing custom events.
    // Properties in payload are available in Resend templates as event.*
    // e.g. event.winner_name, event.winner_score, event.decisions_count
    await resendClient.events.send({
      event: 'decision.completed',
      email: user.email,
      payload: {
        winner_name,
        winner_score:   Math.round(winner_score ?? 0),
        decision_title: decision_title ?? '',
        ai_vertical:    ai_vertical    ?? '',
        decisions_count,
      },
    });
  } catch (err) {
    console.error('resend-event error:', err);
  }

  return NextResponse.json({ ok: true });
}
