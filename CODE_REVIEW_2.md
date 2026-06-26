# AskHoot — Code Review #2 (Pre-Launch)

Reviewer: Claude · Scope: full `decide/` app, ~4,957 lines source (was ~3,300 at review #1)
Follow-up to `CODE_REVIEW.md`. This review verifies what was fixed since #1, audits the new monetization/infra code, and ends with a paste-ready backlog.

---

## Verdict

Strong progress. **Every one of the four launch blockers from review #1 is fixed**, and the team clearly works from a disciplined process (maintained `BACKLOG.md`, typed error handling, privacy/SEO pages). The new affiliate layer is cleanly designed and genuinely config-driven, matching the spec. There are **no remaining launch blockers.** What's left is one backend robustness gap (the rate limiter), one carryover security item (the OG image proxy), an incomplete rebrand that's leaking onto your most viral surface, and an Amazon-compliance detail. None are large.

---

## ✅ Fixed since review #1 (verified in code)

- **Data authorization** — `getDecision`/`loadDecisions`/`deleteDecision` now filter `.eq('user_id', user.id)` as a seatbelt on top of RLS. *(decisions.ts)* ✔
- **Rate limiting** — `lib/ratelimit.ts` exists and is wired into all three AI routes (429 on limit). ✔ *(robustness caveats below)*
- **Weights → true /100** — `computeOptionScore` now normalizes `(score/5)×(weight/Σweight)×100`, so the headline score is correct at any weight sum. Resolves prior blocker #3. *(DecisionMaker.tsx:160-165)* ✔
- **share-debug** — now `notFound()` in production. *(share-debug/page.tsx:5)* ✔
- **Typed Anthropic errors** — all three routes branch on `err.status` (402/429/529) instead of string matching. ✔
- **`content[0]?.type` guard** — added in all three routes. ✔
- **Side-effect out of state updater** — `updateScore` fires `trackEvent` outside `setScores`. ✔
- **Compare mode removed** — the crash-prone `?compare=1` path is gone. ✔
- **Error boundary** — `components/ErrorBoundary.tsx` added *(partial mount — see CR-107)*. ✔
- **SEO + legal** — `robots.ts`, `sitemap.ts`, `/about`, `/privacy` shipped. ✔

Good work. The rest of this doc is the remaining surface.

---

## 🟠 High

### CR-101 — Rate limiter is non-atomic, fails open, and adds latency
`lib/ratelimit.ts` reads the count, then writes it in a separate call:
- **Race (TOCTOU):** two concurrent requests both read `count=19`, both pass, both write `20`. Concurrent abuse slips through.
- **Fails open silently:** none of the Supabase reads/writes are error-checked. If the DB call throws or errors, the function still returns `{allowed:true}`. A Supabase hiccup disables *all* spend protection — the exact thing this guards.
- **Latency:** two sequential DB round-trips on every AI call, in series before Claude is even called.
- **Per-user only:** signups are frictionless (magic link), so a determined abuser just makes more accounts.

Fix: do it in one atomic step — a Postgres function / RPC that upserts and returns the new count (`insert ... on conflict do update set count = api_usage.count + 1 returning count`), then compare. Decide fail-open vs fail-closed *deliberately*. Add a **global daily budget alarm** (PostHog `$ai_generation` cost or an Anthropic budget alert) as the real backstop — per-user limits won't catch a multi-account attack.

### CR-102 — `/api/og` is an unauthenticated open image proxy *(carryover from #1)*
`app/api/og/route.tsx` still renders an attacker-supplied `img` query param into a server-side edge `<img>` (line 28). Anyone can call `/api/og?img=<any-url>` and make your edge function fetch arbitrary remote images — bandwidth/cost abuse and a light SSRF vector. Constrain `img` to an allowlist of expected hosts (Wikipedia, Pexels, your own domain) or drop the external-image feature.

---

## 🟡 Medium

### CR-103 — Incomplete rebrand leaking onto the share card
`BACKLOG.md` marks BKL-015 ("AskHoot rebrand — branding in all locations") **done**, but user-facing "decide" remains:
- `app/history/[id]/page.tsx:345` — share-card wordmark still renders `decide`.
- `app/history/[id]/page.tsx:358` — body copy: "…and **decide** helped me make the call."
- `components/AffiliateCTA.tsx:73` — disclosure: "**Decide** may earn a commission."

These appear on the shared result preview — your single most viral surface — and on every monetized button. Fix the literals and correct BKL-015's status (a "done" ticket that isn't erodes trust in the backlog).

### CR-104 — `lib/brand.ts` is dead code masquerading as the source of truth
`brand.ts` is documented as the "single source of truth for app name, colors, and tagline," but it's **imported nowhere** — name and the color palette are still hardcoded in hundreds of places. Either adopt it (replace the literals, which also prevents CR-103-type drift) or delete it. As-is it's a maintenance trap that actively lies.

### CR-105 — Amazon's required disclosure phrase is missing
Amazon's Operating Agreement requires the exact statement **"As an Amazon Associate I earn from qualifying purchases."** `AffiliateCTA.tsx:74-76` shows a trademark line instead. The generic "may earn a commission" covers the FTC but not Amazon's ToS — and ToS violations get associate accounts terminated. Add the exact phrase when `partnerId === 'amazon'`.

### CR-106 — Amazon attribution is silently dropped
`resolveAffiliate` passes `subId` (the decision ID) through, but the Amazon URL builder ignores it (`affiliate.ts:44-47`). Amazon supports `&ascsubtag=<id>`. Without it you cannot tie an Amazon sale back to a decision/vertical — which is exactly the data your Phase-4 "build templates toward the highest-earning verticals" plan depends on. Append `&ascsubtag=${encodeURIComponent(subId)}`.

### CR-107 — ErrorBoundary only wraps the home route
`ErrorBoundary` is mounted in `app/page.tsx` only. A render crash on `/history/[id]` (e.g., in the share modal or affiliate resolver) still white-screens with no recovery. Move the boundary into `app/layout.tsx` (or add per-segment `error.tsx` files) so all routes are covered.

### CR-108 — `CLAUDE.md` is stale
Still titled "decide," lists `decide-woad.vercel.app`, describes share-debug as a public route, and omits all the new infra (affiliate, ratelimit, resend, posthog-server, profiles, error boundary). This is the orientation doc for future devs and AI agents; staleness propagates mistakes. Refresh it.

---

## 🟢 Low / polish

### CR-109 — Keyword vertical false positives
`affiliate.ts:103` routes generic `\bbuy\b|\bpurchase\b` → `product` (Amazon). A free-text "should I buy a house" (no template) resolves to an Amazon search for "a house." Tighten the catch-all or require a stronger product signal.

### CR-110 — Postback secret in the query string *(Phase-3 stub)*
`api/affiliate/postback/route.ts` takes `?secret=` in the URL; secrets in URLs get logged by CDNs/proxies. When you build Phase 3, move it to a header or signed token and add idempotency on `subid` (networks retry postbacks).

### CR-111 — Comment/code mismatch in consent suppression
`lib/profile.ts:36-37` comment says it "sets unsubscribed=true for users who declined consent," but `api/resend-contact` returns early on `!consent` and never suppresses (resend-contact:27). Fix the comment or implement the suppression.

### CR-112 — "Weights shaped this" chart is un-normalized
`DecisionMaker.tsx:182-187` builds the contribution bars from raw `weight×score` while the headline score is normalized. Bar labels can read oddly when weights ≠ 100. Normalize for consistency.

### CR-113 — `weightValid` badge is now cosmetic and misleading
Since scores are normalized, the red "Total: 97%" badge flags a "problem" that no longer affects anything. Remove it or convert to a soft hint, so you're not implying an error that isn't real.

### CR-114 — Still zero automated tests
Highest-value first targets, all pure and monetization/correctness-critical: `resolveVertical`/`resolveAffiliate` (affiliate.ts), `computeOptionScore` (the normalization math), and the rate-limit logic. Add Vitest + ~10 unit tests; wire into CI.

### CR-115 — God component & duplication persist *(carryover)*
`DecisionMaker.tsx` is now 1,354 lines. The ~90-line share modal is still duplicated with `history/[id]`. Scoring table still built via `React.createElement`. Fonts still loaded via render-blocking `@import` in `about`/`privacy`/`history`/`auth` while `layout.tsx` uses a proper `<link>`. Address opportunistically (extract `<ShareModal>`, adopt `next/font`) next time you're in these files.

### CR-116 — Dead allowlist entry & no error monitoring
`middleware.ts:44` still allowlists `/share-debug` (harmless now that it 404s, but misleading — remove). And there's still no error monitoring — `console.error` goes nowhere in prod; add Sentry or PostHog error tracking.

---

## Paste-ready backlog

| ID | Pri | Effort | Title | Done when |
|----|-----|--------|-------|-----------|
| CR-101 | 🔴 | M | Atomic rate limiter + global budget alarm | Single-RPC increment; deliberate fail policy; budget alert live |
| CR-102 | 🔴 | S | Lock down `/api/og` image param | `img` allowlisted to known hosts or removed |
| CR-103 | 🟡 | S | Fix "decide" leftovers (share card, CTA) | No user-facing "decide"; BKL-015 status corrected |
| CR-104 | 🟡 | S–M | Adopt or delete `brand.ts` | Imported & used, or removed |
| CR-105 | 🟡 | S | Add exact Amazon Associate disclosure | Required phrase shown on Amazon CTAs |
| CR-106 | 🟡 | S | Add `ascsubtag` to Amazon links | Decision ID attributable on Amazon clicks |
| CR-107 | 🟡 | S | Mount ErrorBoundary app-wide | All routes covered (layout or error.tsx) |
| CR-108 | 🟡 | S | Refresh `CLAUDE.md` | Reflects AskHoot + current infra |
| CR-109 | 🟢 | S | Tighten keyword vertical fallback | No Amazon CTA on non-product free-text |
| CR-110 | 🟢 | S | Harden postback (Phase 3) | Secret off-URL; idempotent on subid |
| CR-111 | 🟢 | XS | Fix consent-suppression comment/code | Comment matches behavior |
| CR-112 | 🟢 | XS | Normalize contribution chart | Bars match normalized score |
| CR-113 | 🟢 | XS | Demote/remove weight badge | No false error state |
| CR-114 | 🟢 | M | Add Vitest + core unit tests | affiliate, scoring, rate-limit covered in CI |
| CR-115 | 🟢 | L | Extract ShareModal, `next/font`, split god component | Opportunistic refactor |
| CR-116 | 🟢 | XS | Remove dead allowlist; add error monitoring | Sentry/PostHog errors live |

**Suggested pre-launch cut:** CR-101 → CR-108 (the High + Medium tier). CR-109 → CR-116 can follow launch.

---

## Category summary (your 7 asks)

1. **Architecture** — Healthy and improving. Clean new `lib/` modules (affiliate, ratelimit, resend, posthog-server). Remaining structural debt is the 1,354-line component, the duplicated share modal, and the unused `brand.ts`.
2. **Bugs** — Rate-limiter race (CR-101); rebrand leaks (CR-103); keyword false positives (CR-109); un-normalized chart (CR-112); comment/code mismatch (CR-111).
3. **Expected failures** — Rate limiter fails open on DB error (CR-101); ErrorBoundary gaps on non-home routes (CR-107); OG proxy abuse (CR-102).
4. **Performance** — Two serial DB round-trips per AI call (CR-101); render-blocking font `@import` on several pages (CR-115); scoring table rebuilt via `createElement` each render.
5. **Performance opportunities** — Atomic single-call rate limit; `next/font`; memoize the scoring table; cache OG/wiki responses (already partly done upstream).
6. **Maintainability** — Adopt `brand.ts` (CR-104), refresh `CLAUDE.md` (CR-108), add tests (CR-114), de-duplicate the share modal (CR-115).
7. **Comments/understandability** — Genuinely strong; comments explain intent throughout. Two doc defects to fix: the `profile.ts` mismatch (CR-111) and stale `CLAUDE.md` (CR-108).

**Bottom line:** no blockers remain. Ship after CR-101 and CR-102; clean up the rebrand and Amazon-compliance items (CR-103/105/106) the same week since they touch money and your most-shared surface.
