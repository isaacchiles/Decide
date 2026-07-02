import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resendClient } from '@/lib/resend';

/**
 * POST /api/resend-contact
 *
 * Fires a user.signed_up event to Resend for the authenticated user.
 * If the contact doesn't exist yet, Resend creates it automatically.
 * Triggers Sequence A (welcome + activation nudge) in the Resend automation.
 *
 * Only called when consent === true (fired from lib/profile.ts).
 * Declined users are never added to Resend.
 *
 * Body: { consent: boolean }
 */
export async function POST(req: Request) {
  if (!resendClient) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { consent } = await req.json();

  // Only fire for consenting users — declined users never enter the automation.
  if (!consent) return NextResponse.json({ ok: true });

  // BKL-024: server-side idempotency claim. claim_welcome_email() is an atomic
  // conditional UPDATE (profiles.welcome_email_sent_at null -> now()) — if two
  // requests race (e.g. a magic link opening in a second tab), the database
  // guarantees only one of them gets `true` back. The loser skips sending
  // instead of firing a second user.signed_up event. Closes the cross-tab
  // race that the useRef guard in Analytics.tsx couldn't (see CHANGELOG.md).
  const { data: claimed, error: claimError } = await supabase.rpc('claim_welcome_email', {
    p_user_id: user.id,
  });

  if (claimError) {
    // Fail open: if the RPC itself errors (e.g. migration not yet run), don't
    // block the welcome email entirely — log and fall through to send as before.
    console.error('claim_welcome_email error:', claimError);
  } else if (!claimed) {
    // Another request already claimed this — welcome email already sent/sending.
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await resendClient.events.send({
      event: 'user.signed_up',
      email: user.email,
      payload: {},
    });
  } catch (err) {
    console.error('resend-contact error:', err);
  }

  return NextResponse.json({ ok: true });
}
