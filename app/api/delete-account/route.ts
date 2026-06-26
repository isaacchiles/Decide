import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resendClient } from '@/lib/resend';

/**
 * DELETE /api/delete-account
 *
 * Full account deletion — removes all user data in order:
 *   1. All rows in public.decisions (belt-and-suspenders: eq user_id + RLS)
 *   2. Row in public.profiles
 *   3. Resend contact (best-effort — does not block deletion if it fails)
 *   4. Supabase auth user (service role — must be last)
 *
 * Requires: authenticated session (anon key) + SUPABASE_SERVICE_ROLE_KEY env var.
 * Never expose the admin client to the browser.
 */
export async function DELETE() {
  // ── 1. Verify authenticated session ────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = user.id;
  const userEmail = user.email ?? '';

  // ── 2. Delete all decisions ─────────────────────────────────────────────────
  const { error: decisionsError } = await supabase
    .from('decisions')
    .delete()
    .eq('user_id', userId);

  if (decisionsError) {
    console.error('[delete-account] decisions delete error:', decisionsError);
    return NextResponse.json({ error: 'Failed to delete decisions' }, { status: 500 });
  }

  // ── 3. Delete profile row ───────────────────────────────────────────────────
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    console.error('[delete-account] profile delete error:', profileError);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }

  // ── 4. Remove from Resend (best-effort) ────────────────────────────────────
  // Fires a user.deleted event so Resend automations can unsubscribe the contact.
  // Failure here does NOT block account deletion — log and continue.
  if (resendClient && userEmail) {
    try {
      await resendClient.events.send({
        event: 'user.deleted',
        email: userEmail,
        payload: {},
      });
    } catch (err) {
      console.error('[delete-account] Resend contact removal failed (non-fatal):', err);
    }
  }

  // ── 5. Delete Supabase auth user (must be last — invalidates the session) ──
  const adminClient = createAdminClient();
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

  if (authDeleteError) {
    console.error('[delete-account] auth user delete error:', authDeleteError);
    return NextResponse.json({ error: 'Failed to delete auth user' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
