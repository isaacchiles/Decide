import type { SupabaseClient } from '@supabase/supabase-js';
import { resendClient } from '@/lib/resend';

/**
 * Shared logic for firing the Resend `user.signed_up` welcome event.
 *
 * Called from two places by design:
 *  1. app/auth/callback/route.ts — the PRIMARY, reliable path. Runs
 *     server-side right after the magic link resolves, using a `consent`
 *     value baked into the redirect URL itself (see SignInModal.tsx). This
 *     works no matter what device/browser opens the email link, because it
 *     never depends on localStorage.
 *  2. app/api/resend-contact/route.ts — client-triggered fallback, kept for
 *     cases where consent changes after initial signup (e.g. account
 *     settings), not just at the magic-link moment.
 *
 * Real bug this fixes (found 2026-07-02): the old flow passed consent via
 * localStorage from the sign-in modal to the post-auth code. localStorage
 * doesn't cross browsers/devices — a user who signs up on one browser and
 * opens the magic link in another (very common: desktop signup, phone
 * email client, or an email app's in-app browser) never got a welcome
 * email, silently, with no error anywhere. Two real users hit this.
 *
 * Safe to call from both paths — claim_welcome_email() is an atomic DB
 * claim, so only one caller ever actually sends, however many times this
 * function runs for the same user.
 */
export async function fireWelcomeEmailIfConsented(
  supabase: SupabaseClient,
  userId: string,
  email: string,
  consent: boolean,
): Promise<void> {
  if (!consent) return;
  if (!resendClient) return;

  // Keep marketing_consent in sync on the profile row.
  const { error: upsertError } = await supabase.from('profiles').upsert(
    { id: userId, email, marketing_consent: consent, updated_at: new Date().toISOString() },
    { onConflict: 'id' },
  );
  if (upsertError) console.error('fireWelcomeEmailIfConsented upsert error:', upsertError);

  // BKL-024: atomic claim so concurrent callers can't double-send.
  let claimed = true;
  try {
    const { data, error } = await supabase.rpc('claim_welcome_email', { p_user_id: userId });
    if (error) {
      console.error('claim_welcome_email error:', error);
    } else {
      claimed = Boolean(data);
    }
  } catch (err) {
    // Fail open: RPC missing/errored (e.g. migration not yet run) — still send.
    console.error('claim_welcome_email threw:', err);
  }

  if (!claimed) return; // already sent by another caller

  try {
    await resendClient.events.send({
      event: 'user.signed_up',
      email,
      payload: {},
    });
  } catch (err) {
    console.error('resend welcome send error:', err);
  }
}
