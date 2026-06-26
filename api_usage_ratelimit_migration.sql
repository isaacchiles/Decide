-- ============================================================================
-- CR-101: Atomic per-user daily rate limiting
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- Safe to re-run: uses "if not exists" / "create or replace".
-- ============================================================================

-- 1. Usage table (no-op if it already exists from the earlier read+write version)
create table if not exists public.api_usage (
  user_id  uuid    not null references auth.users(id) on delete cascade,
  endpoint text    not null,
  date     date    not null default current_date,
  count    integer not null default 0,
  primary key (user_id, endpoint, date)
);

alter table public.api_usage enable row level security;

-- Recreate the owner policy idempotently
drop policy if exists "users own usage" on public.api_usage;
create policy "users own usage" on public.api_usage
  for all using (auth.uid() = user_id);

-- 2. Atomic increment RPC.
--    A single statement does insert-or-increment and returns the NEW count,
--    eliminating the read-then-write race (TOCTOU) in the old TS code.
--    user_id is taken from auth.uid() inside the function — the client cannot
--    spoof another user's counter.
create or replace function public.increment_api_usage(p_endpoint text)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_count integer;
begin
  if v_uid is null then
    -- No authenticated user; signal caller to handle (fail open in TS).
    return -1;
  end if;

  insert into public.api_usage (user_id, endpoint, date, count)
  values (v_uid, p_endpoint, current_date, 1)
  on conflict (user_id, endpoint, date)
  do update set count = public.api_usage.count + 1
  returning count into v_count;

  return v_count;
end;
$$;

-- Allow authenticated users to call the RPC
grant execute on function public.increment_api_usage(text) to authenticated;

-- ============================================================================
-- To audit usage: Supabase → Table editor → api_usage → filter by date.
-- ============================================================================
