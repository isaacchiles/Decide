/**
 * Per-user daily rate limiting via Supabase.
 *
 * Before deploying, run the migration in `api_usage_ratelimit_migration.sql`
 * (Supabase → SQL Editor). It creates the `api_usage` table and the atomic
 * `increment_api_usage(p_endpoint)` RPC this module depends on.
 *
 * Why an RPC: the previous version did a SELECT then a separate INSERT/UPDATE.
 * Two concurrent requests could both read count=19 and both write 20, letting a
 * user exceed the cap (TOCTOU race). The RPC does insert-or-increment in a
 * single statement and returns the new count, so increments are atomic.
 *
 * Daily limits (generous for real use, blocks runaway API abuse):
 *   generate-matrix  → 20/day  (~20 full decisions)
 *   suggest-scores   → 20/day
 *   suggest-options  → 15/day  (~5 decisions × 3 suggests)
 *
 * FAIL-OPEN policy: if the DB/RPC errors, we ALLOW the request. A transient
 * Supabase blip should not block real users. The hard ceiling on total spend
 * is the global budget alarm (see BUDGET_ALARM.md / Anthropic Console spend
 * limit), not this per-user counter.
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
  _userId: string,
  endpoint: string
): Promise<RateLimitResult> {
  const limit = DAILY_LIMITS[endpoint];
  if (!limit) return { allowed: true }; // unknown endpoint — let through

  try {
    const supabase = await createClient();

    // Atomic insert-or-increment; returns the NEW count for (user, endpoint, today).
    // user_id is derived from auth.uid() inside the RPC — not trusted from the client.
    const { data, error } = await supabase.rpc('increment_api_usage', {
      p_endpoint: endpoint,
    });

    // FAIL OPEN on any DB error, or if the RPC reports no authenticated user (-1).
    if (error) {
      console.error('[ratelimit] RPC error — failing open:', error.message);
      return { allowed: true };
    }

    const newCount = typeof data === 'number' ? data : Number(data);
    if (!Number.isFinite(newCount) || newCount < 0) {
      // -1 = no auth.uid(), or unexpected payload — fail open.
      return { allowed: true };
    }

    // This request is the Nth use today. Allow the first `limit` uses; block beyond.
    if (newCount > limit) {
      return { allowed: false, error: 'rate_limited', limit };
    }

    return { allowed: true };
  } catch (e) {
    // Network/throw — fail open.
    console.error('[ratelimit] unexpected error — failing open:', e);
    return { allowed: true };
  }
}
