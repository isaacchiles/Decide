import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resendClient, RESEND_AUDIENCE_ID } from '@/lib/resend';

/**
 * POST /api/resend-contact
 *
 * Adds or updates a contact in the Resend audience.
 * Called from lib/profile.ts → updateMarketingConsent() after the user
 * resolves their consent preference on signup.
 *
 * Creates the contact if new (triggers the welcome automation in Resend),
 * or updates unsubscribed status if returning.
 *
 * Body: { consent: boolean }
 */
export async function POST(req: Request) {
  if (!resendClient || !RESEND_AUDIENCE_ID) {
    // Resend not configured — skip silently (local dev without keys)
    return NextResponse.json({ ok: true });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { consent } = await req.json();

  try {
    await resendClient.contacts.create({
      audienceId:   RESEND_AUDIENCE_ID,
      email:        user.email,
      unsubscribed: consent === false,
    });
  } catch (err) {
    // contact.create upserts, so a duplicate is fine — log anything else
    console.error('resend-contact error:', err);
  }

  return NextResponse.json({ ok: true });
}
