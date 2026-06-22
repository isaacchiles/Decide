/**
 * Per-user daily rate limiting via Supabase.
 *
 * Run this migration in your Supabase SQL editor before deploying:
 *
 *   create table if not exists api_usage (
 *     user_id  uuid references auth.users(id) on delete cascade,
 *     endpoint text    not null,
 *     date     date    not null default current_date,
 *     count    integer not null default 0,
 *     primary key (user_id, endpoint, date)
 *   );
 *
 *   alter table api_usage enable row level security;
 *
 *   create policy "users own usage" on api_usage
 *     for all using (auth.uid() = user_id);
 *
 * Daily limits (generous for real use, blocks runaway API abuse):
 *   generate-matrix  → 20/day  (~20 full decisions)
 *   suggest-scores   → 20/day
 *   suggest-options  → 15/day  (~5 decisions × 3 suggests)
 *
 * To audit: open Supabase table editor → api_usage → filter by date.
 */

import { createClient } from '@/lib/supabase/server';

const DAILY_LIMITS: Record<string, number> = {
  'generate-matrix': 20,
  'suggest-scores':  20,
  'suggest-options': 15,
};

type RateLimitResult =
  | { allowed: true }
  | { allowed: false; error: 'rate_limited'; limit: number };

export async function checkAndIncrementLimit(
  userId: string,
  endpoint: string
): Promise<RateLimitResult> {
  const limit = DAILY_LIMITS[endpoint];
  if (!limit) return { allowed: true }; // unknown endpoint — let through

  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // Read current count for today
  const { data: row } = await supabase
    .from('api_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .eq('date', today)
    .maybeSingle();

  const currentCount = row?.count ?? 0;

  // Reject before writing if already at limit
  if (currentCount >= limit) {
    return { allowed: false, error: 'rate_limited', limit };
  }

  // Increment (insert or update)
  if (!row) {
    await supabase.from('api_usage').insert({
      user_id: userId, endpoint, date: today, count: 1,
    });
  } else {
    await supabase.from('api_usage')
      .update({ count: currentCount + 1 })
      .eq('user_id', userId)
      .eq('endpoint', endpoint)
      .eq('date', today);
  }

  return { allowed: true };
}
