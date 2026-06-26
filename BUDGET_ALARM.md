# Global daily budget alarm (CR-101)

The per-user rate limiter (`lib/ratelimit.ts`) **fails open** — if the database
hiccups, requests are allowed through. That keeps real users unblocked, but it
means the per-user counter is NOT the last line of defense against a runaway
Anthropic bill. These two alarms are. Set both once.

## 1. Anthropic Console spend limit — the HARD ceiling (blocks spend)

This is the one that actually stops charges; do this first.

1. Go to https://console.anthropic.com → **Settings → Limits** (a.k.a. Usage limits / Billing limits).
2. Set a **monthly usage limit** at a number you're comfortable with pre-launch
   (e.g. $50–$100). When the org hits it, the API returns errors instead of billing further.
3. Add an **email alert threshold** below the cap (e.g. 50% and 80%) so you hear about it early.

This is account-wide and needs no code.

## 2. PostHog alert on `$ai_generation` cost — the early-warning (notifies)

We already emit `$ai_generation` events server-side via `lib/posthog-server.ts`,
which include token + cost properties. PostHog can watch the daily total and email you.

1. In PostHog → **Insights → New insight**.
2. Event: `$ai_generation`. Choose a **sum** of the cost property
   (`$ai_total_cost_usd`, or sum tokens if cost isn't populated).
3. Set the interval to **daily**.
4. Open the insight → **Alerts → New alert**. Trigger when the daily value
   exceeds your threshold (e.g. > $15/day). Set it to email you.

PostHog only *notifies* — it does not block. The Console limit in step 1 is the
thing that actually halts spend.

## Why both
- Step 1 (Anthropic) = hard stop, prevents a catastrophic bill.
- Step 2 (PostHog) = early warning, tells you *why* (which day/usage spiked) before the hard stop trips.
