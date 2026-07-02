# AskHoot — Changelog

Append-only log of shipped changes. Multiple AI models/threads work on this repo —
this file is the fast way for any of them to see what changed recently without
reading full git history. **Every thread that ships a change adds an entry here
in the same commit**, newest entry on top.

Entry format:
```
## YYYY-MM-DD — Short title (thread/model if known)
- What changed, one line per change
- Why, if not obvious
```

If a change also alters stack/architecture facts (model version, new route, new
env var, new table), update `CLAUDE.md` in the same commit — this file records
*that it happened*, CLAUDE.md records *current state*.

---

## 2026-07-02 — HOTFIX: welcome email + Resend contact silently not firing at all
- Isaac hit this live: 2 new signups, zero welcome emails, and neither appeared
  in Resend's Audience — no visible error anywhere.
- Root cause: the BKL-024 change below added a `supabase.rpc('claim_welcome_email')`
  call that wasn't wrapped in try/catch — only the returned `{error}` field was
  checked. If the migration hasn't been run in Supabase yet, the RPC target
  doesn't exist, and depending on client behavior that can throw instead of
  resolving gracefully — killing the whole request before it ever reached
  `resendClient.events.send()`. Fully silent: no contact created, no email,
  no error surfaced.
- Fix: wrapped the RPC call itself in try/catch (not just the returned error
  field) in `app/api/resend-contact/route.ts`, defaulting `claimed = true` so
  any RPC failure mode — missing function, thrown exception, or returned
  error — always fails open and still sends. This route can no longer be
  fully killed by the idempotency check underneath it.
- Isaac: still worth confirming `welcome_email_idempotency_migration.sql` has
  actually been run in Supabase — this fix makes the failure mode harmless,
  but the idempotency protection itself only kicks in once the migration exists.

## 2026-07-02 — BKL-024: server-side idempotency for welcome email (closes cross-tab race)
- Added `welcome_email_sent_at timestamptz` to `profiles` (see
  `welcome_email_idempotency_migration.sql` — Isaac needs to run this in the
  Supabase SQL editor before this ships) plus an atomic RPC,
  `claim_welcome_email(p_user_id)`, that does a single conditional
  `UPDATE ... WHERE welcome_email_sent_at IS NULL RETURNING true`.
- `app/api/resend-contact/route.ts` now calls this RPC before sending
  `user.signed_up` — only the request that wins the atomic claim actually
  sends the event; a losing concurrent request (e.g. the magic link opening
  a second tab) gets `null` back and skips sending entirely.
- This closes the gap the `useRef` guard in `Analytics.tsx` (2026-07-02,
  below) couldn't: that guard only prevented a double-fire *within one tab*.
  The real duplicate-welcome-email bug was two tabs independently reading
  the same `askhoot_marketing_consent` localStorage flag — a client-side
  guard can't fix that; this database-level compare-and-swap can.
- Fails open: if the RPC errors (e.g. migration not yet run), the route logs
  and falls through to send anyway rather than silently dropping the welcome
  email for everyone.

## 2026-07-02 — Fixed duplicate decision.completed firing (two /events/send, no email)
- Isaac found two `/events/send` log entries in a row for the same decision
  completion, with no email ever sent by the follow-up workflow for either.
- Found two real bugs in `handleSave()` (`DecisionMaker.tsx`), both fixed:
  1. The in-flight guard used `saving` (React state), which isn't
     synchronous — two near-simultaneous calls could both read the stale
     `saving === false` before the first call's `setSaving(true)` flushed,
     letting both through. Replaced with `savingRef` (a ref, updates
     immediately).
  2. No guard existed against `handleSave()` re-running for an
     *already-completed* decision — revisiting step 5 (back/forward nav)
     would re-save and re-fire `decision.completed` every time. Added
     `completedFiredRef`, keyed by decisionId, deliberately kept separate
     from `savedId` — the resume-draft flow sets `savedId` before step 5 is
     ever reached, so reusing it for this guard would have incorrectly
     skipped the real completion save for resumed drafts.
- This doesn't rule out the Resend workflow structure issue flagged earlier
  (redundant "Wait for event" node) — both could be true. Worth re-testing
  the follow-up email now that the double-fire is fixed, since it's possible
  the workflow was simply never getting a single clean trigger to work with.

## 2026-07-02 — Email automation bugs found (duplicate welcome email + follow-up not firing)
- Root cause of duplicate "You're In" email: `updateMarketingConsent()` fires
  `/api/resend-contact` → `resend.events.send('user.signed_up')` with no
  idempotency check, and `applyPendingConsent()` in `Analytics.tsx` is
  deliberately called from two listeners to cover both magic-link redirect
  shapes. Most likely trigger: magic link opens in a new tab while the
  original stays open — both independently read/act on the same
  `askhoot_marketing_consent` localStorage flag before either clears it.
- Added a same-tab guard (`useRef`) in `Analytics.tsx` as an immediate,
  low-risk stopgap — does NOT close the cross-tab race. Real fix tracked as
  BKL-024 (server-side idempotency column on `profiles`) — needs a migration,
  deferred rather than rushed pre-launch.
- Decision-follow-up automation (Resend workflow, `decision.completed`
  trigger) confirmed NOT reproducible as a code bug — `resend-event` fires
  correctly from `DecisionMaker.tsx` only after a successful authenticated
  save (anonymous decisions never reach this code path, by design/RLS).
  Likely cause is in the Resend workflow itself — flagged for Isaac to check:
  (1) whether "Wait for event: decision.completed" is placed directly under
  its own matching "Custom event: decision.completed" trigger, which would
  make it wait for a SECOND occurrence of an event most users only fire once;
  (2) whether the test contact actually has marketing consent / exists as a
  Resend contact at all; (3) Resend's Logs for whether the event is arriving.
- Also flagged: the Welcome Email workflow has an "Update contact: Clear
  profiles.email" step that looks like leftover/misconfigured test content —
  unrelated to the follow-up bug but worth removing.

## 2026-07-02 — New templates (Baby Items, Smart Home), hid Home Purchase, richer examples
- Added `baby` (car seat) and `smart-home` (smart light bulbs) templates to
  `lib/templates.ts`, based on `askhoot_usecases_share.md`'s stronger example set
- Hid Home Purchase template — added a `hidden` flag to `Template` type rather
  than deleting it, so it's easy to bring back. Template picker in
  `DecisionMaker.tsx` now filters `!t.hidden`
- Mapped both new templates to the `product` (Amazon) affiliate vertical in
  `lib/affiliate.ts` — `TEMPLATE_VERTICALS` takes priority over AI/keyword
  classification, so this was necessary for affiliate CTAs to resolve correctly
- Added one more constraint + one more preference to each of the 8 rotating
  "Try an example" sets — modeling slightly richer input to nudge users toward
  sharing more detail, without turning the examples into a wall of text
- Hid Job Offer template and added Robot Vacuum in its place — job offers
  aren't built out (needs enhanced option-input, see BACKLOG BKL-004) and have
  no affiliate outcome; robot vacuums are high-research, high-affiliate-fit,
  and map cleanly to weighted criteria. Job kept (hidden) as a content pillar.

## 2026-07-02 — HOTFIX: "Could not parse AI response" on generate-matrix
- Root cause: Sonnet 5 has adaptive thinking on by default, so a `thinking`
  content block can precede the `text` block in the response. All 3 AI routes
  (`generate-matrix`, `suggest-scores`, `suggest-options`) assumed the text was
  always `message.content[0]`, so any response starting with a thinking block
  returned an empty string and failed JSON parsing — even though Claude had
  answered correctly (confirmed via PostHog LLM trace: HTTP 200, valid JSON
  output, but our own code discarded it before parsing)
- Fix: find the first block with `type === 'text'` instead of assuming index 0
- Live since the Sonnet 5 migration (2026-07-01) — non-deterministic failure
  rate depending on whether Claude decided to think first, which is why it
  wasn't caught immediately. Isaac hit it live via a real generate-matrix call.
- Follow-up decision: disabled adaptive thinking (`thinking: {type: "disabled"}`)
  on all 3 AI routes. Isaac noticed materially longer wait times testing Sonnet 5
  vs. 4.6 and prioritized latency on this live-loading-screen path over the
  unproven quality upside of thinking on short structured-JSON tasks. Revisit
  later — can re-enable per-route to A/B quality once there's room to test.

## 2026-07-01 — PostHog MCP connected + launch prep executed directly
- Connected PostHog MCP (mcp.posthog.com) — Claude can now query/create insights,
  alerts, feature flags, surveys, dashboards directly instead of writing manual steps
- Found and fixed a real bug: the AI-cost alert was named "> $15" but its actual
  threshold was $10 — renamed the alert and its threshold to "$10" to match
- Extended "Decision completion funnel" insight → "Decision completion + affiliate
  funnel": added `recommendation_viewed` and `affiliate_click` (optional) steps,
  so it now covers the full decision_started → affiliate_click path
- Created feature flag `linkedin-launch-rollout` (10% initial rollout, active) —
  NOT yet wired into any code path; needs a `posthog.isFeatureEnabled()` check
  added wherever we want to gate LinkedIn traffic before this does anything
- Created draft survey "Decision abandonment exit survey" — one open question,
  triggers on `decision_abandoned`, NOT launched (no start_date set) — review
  copy/targeting in PostHog then launch when ready
- Confirmed "AskHoot Core Metrics" dashboard (15 tiles) and the $ai_generation
  cost alert both already existed from a prior session — no dashboard rebuild needed

## 2026-07-01 — Reverted CLAUDE.md rename
- Briefly renamed `CLAUDE.md` → `START_HERE.md`, then reverted. Isaac works
  Claude-only, and `CLAUDE.md` is the filename Claude Code auto-loads without
  being told — renaming it would have silently lost that for no benefit.
  Kept the filename; added an explicit "read this file first" line at the top
  instead, and pointed Cowork's Project Instructions at it directly.

## 2026-07-01 — PostHog data machine for LinkedIn launch (Sonnet 5 thread)
- Enabled session recording (was off by default) with `maskAllInputs: true` +
  `maskTextSelector: '[data-ph-mask]'` so free-text decision/constraint/
  preference content is never visible in a replay — keeps parity with the
  "never track user content" rule in `lib/analytics.ts`
- Wired PostHog Error Tracking: `ErrorBoundary.tsx` now calls
  `posthog.captureException`; `generate-matrix`, `suggest-scores`,
  `suggest-options` catch blocks now call `posthogServer.captureException`
- Added an orchestration protocol section to `CLAUDE.md` for multi-model sync
- Still needed before ~1,500-user LinkedIn launch (PostHog dashboard, no code):
  confirm the `$ai_generation` cost alert from `BUDGET_ALARM.md` is actually
  set; build a funnel insight (decision_started → ... → affiliate_click);
  consider a feature-flag gate for staged rollout; consider a one-question
  exit survey on abandonment; confirm privacy policy discloses session replay

## 2026-07-01 — Sonnet 5 migration + max_tokens increase (Sonnet 5 thread)
- Switched `generate-matrix`, `suggest-scores`, `suggest-options` from
  `claude-sonnet-4-6` to `claude-sonnet-5`
- Raised `max_tokens`: generate-matrix 1024→2048, suggest-scores 1024→2048,
  suggest-options 256→512 — Sonnet 5's new tokenizer produces ~30% more tokens
  for the same text, so old caps were effectively tighter than when set
- Updated `CLAUDE.md` stack section to reflect Sonnet 5
- Not yet committed/deployed — see terminal command in thread
