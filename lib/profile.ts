/**
 * profile.ts — client-side helpers for the public.profiles table.
 *
 * The profiles table is auto-created by a Supabase trigger when a user
 * signs up. These helpers let the app update user-level fields
 * (marketing consent, plan, etc.) after that.
 */

import { createClient } from '@/lib/supabase/client';

/**
 * Upsert the authenticated user's marketing consent preference.
 * Called from Analytics.tsx after the magic link resolves, using a
 * value stored in localStorage during the sign-in modal interaction.
 */
export async function updateMarketingConsent(consent: boolean): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id:                user.id,
        email:             user.email ?? '',
        marketing_consent: consent,
        updated_at:        new Date().toISOString(),
      },
      { onConflict: 'id' },
    );

  if (error) console.error('updateMarketingConsent error:', error);

  // Add/update contact in Resend audience — fire-and-forget.
  // For new users this triggers Sequence A (welcome automation).
  // Sets unsubscribed=true for users who declined consent.
  fetch('/api/resend-contact', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ consent }),
  }).catch(() => { /* non-critical — don't block on email infra */ });
}

/**
 * Fetch the authenticated user's profile.
 * Returns null if not signed in or profile doesn't exist yet.
 */
export async function getProfile() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data;
}
