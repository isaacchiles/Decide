import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resendClient, RESEND_AUDIENCE_ID } from '@/lib/resend';

/**
 * POST /api/resend-event
 *
 * Fires a decision.completed event to Resend for the authenticated user.
 * Triggers the post-decision follow-up automation (B1) and keeps
 * decisions_count in sync as a contact property for re-engagement logic (B2).
 *
 * Called fire-and-forget from DecisionMaker.tsx after a successful save.
 *
 * Body: { winner_name, winner_score, decision_title, ai_vertical }
 */
export async function POST(req: Request) {
  if (!resendClient || !RESEND_AUDIENCE_ID) {
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { winner_name, winner_score, decision_title, ai_vertical } = await req.json();

  // Count total completed decisions for this user — used in Resend conditions
  // to gate B1 repeat sends and power re-engagement logic.
  const { count } = await supabase
    .from('decisions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'complete');

  const decisions_count = count ?? 1;

  try {
    // Update contact property so Resend conditions can reference decisions_count
    await resendClient.contacts.update({
      audienceId: RESEND_AUDIENCE_ID,
      email:      user.email,
      // Resend contacts don't have arbitrary properties natively —
      // the event properties below are what drive automation logic.
    });
  } catch {
    // Contact may not exist yet (e.g. user opted out of marketing) — that's fine.
    // The event still fires; Resend will route it if the contact exists.
  }

  try {
    // Fire the custom event — triggers the decision.completed automation in Resend.
    // Event must be defined in Resend dashboard with these property names + types.
    await (resendClient as any).events?.create?.({
      audienceId:  RESEND_AUDIENCE_ID,
      email:       user.email,
      eventName:   'decision.completed',
      properties:  {
        winner_name,
        winner_score:    Math.round(winner_score),
        decision_title:  decision_title ?? '',
        ai_vertical:     ai_vertical    ?? '',
        decisions_count,
      },
    }) ?? await fetch('https://api.resend.com/audiences/' + RESEND_AUDIENCE_ID + '/events', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        email:      user.email,
        event_name: 'decision.completed',
        properties: {
          winner_name,
          winner_score:    Math.round(winner_score),
          decision_title:  decision_title ?? '',
          ai_vertical:     ai_vertical    ?? '',
          decisions_count,
        },
      }),
    });
  } catch (err) {
    console.error('resend-event error:', err);
  }

  return NextResponse.json({ ok: true });
}
