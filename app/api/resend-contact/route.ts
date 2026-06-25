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
