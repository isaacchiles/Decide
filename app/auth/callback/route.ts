import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { fireWelcomeEmailIfConsented } from '@/lib/resendWelcome';

/**
 * Handles the redirect after a user clicks the magic link in their email.
 * Supabase sends a `code` param; we exchange it for a session.
 *
 * `consent` travels here as a query param baked into the magic link's
 * redirect URL by SignInModal.tsx — NOT via localStorage. This is
 * deliberate: this route runs wherever the link is opened, regardless of
 * device/browser, so it's the reliable place to fire the welcome email.
 * See lib/resendWelcome.ts for why the old localStorage-based flow
 * silently failed for users who opened the link on a different device.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code    = searchParams.get('code');
  const next    = searchParams.get('next') ?? '/';
  const consent = searchParams.get('consent') === 'true';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        await fireWelcomeEmailIfConsented(supabase, user.id, user.email, consent);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, send them back to sign in
  return NextResponse.redirect(`${origin}/auth?error=could_not_sign_in`);
}
