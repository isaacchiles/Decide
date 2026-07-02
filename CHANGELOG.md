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
