import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resendClient } from '@/lib/resend';
import { fireWelcomeEmailIfConsented } from '@/lib/resendWelcome';

/**
 * POST /api/resend-contact
 *
 * Client-triggered FALLBACK path for firing the user.signed_up welcome
 * event — kept for same-browser flows and for consent changes after the
 * initial signup moment. The PRIMARY, reliable path is now
 * app/auth/callback/route.ts, which fires server-side right when the magic
 * link resolves, using a consent value baked into the redirect URL instead
 * of localStorage. See lib/resendWelcome.ts for why that matters (device/
 * browser-crossing magic links silently dropped welcome emails before).
 *
 * Safe to call alongside the callback path — fireWelcomeEmailIfConsented()
 * uses an atomic DB claim, so only one caller ever actually sends.
 *
 * Body: { consent: boolean }
 */
export async function POST(req: Request) {
  if (!resendClient) return NextResponse.json({ ok: true });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { consent } = await req.json();
  await fireWelcomeEmailIfConsented(supabase, user.id, user.email, consent);

  return NextResponse.json({ ok: true });
}
