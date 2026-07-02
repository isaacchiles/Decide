-- ============================================================================
-- BKL-024: Server-side idempotency for the user.signed_up welcome email
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses "if not exists".
-- ============================================================================

-- 1. Marker column — null until the welcome event has been sent once.
alter table public.profiles
  add column if not exists welcome_email_sent_at timestamptz;

-- 2. Atomic claim RPC.
--    A single conditional UPDATE is the "compare-and-swap": only the request
--    that actually flips the column from null -> now() gets a row back.
--    If two requests (e.g. two tabs from the same magic-link race) call this
--    at nearly the same instant, the database's row lock guarantees only one
--    of them wins — the loser gets zero rows and knows to skip sending.
--    This replaces the client-side useRef guard in Analytics.tsx, which only
--    protected against a double-fire within a single tab.
create or replace function public.claim_welcome_email(p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  update public.profiles
  set welcome_email_sent_at = now()
  where id = p_user_id
    and welcome_email_sent_at is null
  returning true;
$$;

grant execute on function public.claim_welcome_email(uuid) to authenticated;

-- ============================================================================
-- To audit: Supabase → Table editor → profiles → welcome_email_sent_at column.
-- A user with a timestamp has (or is about to have) received the welcome
-- email exactly once; null means they haven't yet.
-- ============================================================================
