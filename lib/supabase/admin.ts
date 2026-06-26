import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client — bypasses RLS.
 * SERVER-SIDE ONLY. Never import in client components or expose to the browser.
 *
 * Used exclusively for operations that require elevated privileges:
 *   - Deleting a user's Supabase auth record (account deletion flow)
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
