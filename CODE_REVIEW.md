# Decide — Pre-Launch Code Review

Reviewer: Claude · Scope: full `decide/` Next.js 14 app (~3,300 lines source)
Stack: Next.js App Router, React 18, Supabase (SSR auth + Postgres), Anthropic SDK, PostHog.

This is an unedited critique. It is organized by severity first (launch blockers → nice-to-haves), then mapped to your seven review categories at the end. Line references point at `decide/`.

---

## Verdict

This is a well-built, cohesive product. The auth flow, analytics abstraction, error-state UX, and OG/share pipeline are genuinely thoughtful, and the privacy-by-design analytics layer is above average. But there are **three things I would not launch without fixing**, plus a debug endpoint that's currently shipping to production. None are hard to fix.

---

## 🔴 Launch blockers

### 1. Data authorization relies entirely on Supabase RLS — no defense in depth
`lib/decisions.ts` is the only thing standing between users and each other's data, and it provides **zero** application-level authorization:

```ts
// getDecision(id)
.from('decisions').select('*').eq('id', id).single()      // no .eq('user_id', …)
// deleteDecision(id)
.from('decisions').delete().eq('id', id)                  // no .eq('user_id', …)
// loadDecisions()
.from('decisions').select('*').order('created_at', …)     // no user filter at all
```

Only `saveDecision` sets `user_id`. Reads and deletes are scoped to the current user **only if** a correct Row-Level-Security policy exists on the `decisions` table. The client uses the **anon key**, so if RLS is missing, misconfigured, or accidentally disabled, any authenticated user can read or delete any decision by guessing/iterating IDs (UUIDs, so not trivially enumerable, but IDs leak via share flows and history URLs).

**Action before launch:**
- Confirm RLS is enabled on `decisions` with `select`/`insert`/`update`/`delete` policies keyed to `auth.uid() = user_id`. Don't take this on faith — test it: sign in as user B and `GET /history/<user-A-decision-id>`.
- Add belt-and-suspenders `.eq('user_id', user.id)` to `getDecision`, `loadDecisions`, and `deleteDecision`. RLS should be the wall; the query filter is the seatbelt.

### 2. No rate limiting on paid AI endpoints — cost & abuse risk
`/api/generate-matrix`, `/api/suggest-scores`, `/api/suggest-options` each call the Anthropic API and are gated only by "is logged in." Magic-link sign-up is frictionless, so the practical barrier to spending your API budget is ~one email address. `suggest-options` is capped at 3 **on the client only** (`SUGGEST_MORE_LIMIT`) — trivially bypassed by hitting the route directly. `generate-matrix` (the most expensive, runs Sonnet, and *doubles* in `?compare=1`) has no cap at all.

**Action:** add per-user (and/or per-IP) rate limiting before these routes hit Anthropic — Upstash/Vercel KV ratelimit, or a Supabase counter. Enforce the suggest-more cap server-side too.

### 3. Weights are never forced to sum to 100, but the UI reports scores "out of 100"
- `weightValid = totalWeight === 100` (`DecisionMaker.tsx:84`) is used **only** for badge color and a telemetry flag. It never gates anything — `startScoring` runs regardless (confirmed: the "Score My Options" button has no `disabled`/guard).
- The weight slider is capped at `max="60"` (line 915), and there is no auto-rebalancing. So **any** adjustment off the AI's default breaks the sum, and the user can't necessarily get back to 100.
- `computeOptionScore` = `Σ (score/5 × weight)`. If weights sum to 80, the maximum possible score is 80, not 100 — yet the winner card, history, and share text all say "scored X **out of 100**." The headline number the whole app is built around is quietly wrong whenever weights ≠ 100.
- The server prompt asks the model to sum to 100 but never validates/normalizes the response, so even an untouched matrix can arrive at, say, 98.

**Action (pick one):** normalize weights to 100 at score time (`weight_i / Σweight × 100`), **or** gate progression on `weightValid` with an auto-balance helper, **or** stop claiming "/100" and show the actual max. Normalization is the least disruptive and also fixes the server-side drift.

### 4. `share-debug` is a public production endpoint
`app/share-debug/page.tsx` is explicitly allow-listed in `middleware.ts` (line 44), runs server-side fetches to Wikipedia on every load, and prints your deploy origin + diagnostics to anyone who visits `/share-debug`. It's a dev tool that's shipping.

**Action:** delete it, or gate behind `NODE_ENV !== 'production'`, before launch.

---

## 🟠 High — fix soon

### 5. Compare mode crashes on any API error
In `startLoading` (`DecisionMaker.tsx:206-213`), compare mode stores raw responses straight into `compareData` and only conditionally applies `criteria`. If either model returns `{ error: … }` (credits exhausted, overload), `compareData[model].criteria` is `undefined`, and the render at line 857/867 does `result.criteria.length` / `result.criteria.map(...)` → `TypeError`, blanking the app. The single-model path handles `data.error`; the compare path does not. It's behind `?compare=1` (internal), so severity is lower, but it's a guaranteed crash with no error boundary to catch it.

### 6. No React error boundary anywhere
A single render throw (e.g. #5, or any unexpected AI payload shape) white-screens the entire app. For a launch-quality product, wrap the tree in an error boundary with a recovery CTA.

### 7. `metadataBase` silently falls back to localhost
`app/layout.tsx:6-9` falls back to `http://localhost:3000` if neither `NEXT_PUBLIC_APP_URL` nor `VERCEL_URL` is set. The entire share/OG value prop (`/api/og` image URLs are resolved relative to `metadataBase`) breaks if that env var is missing in prod — link previews point at localhost. Make sure `NEXT_PUBLIC_APP_URL` is set in the production environment, and consider failing the build if it's absent.

### 8. `/api/og` and `/api/wiki-image` are unauthenticated and proxy attacker-controlled inputs
`/api/og?img=<url>` renders an arbitrary remote image server-side (edge `ImageResponse` fetches it), and `/api/wiki-image?q=…` triggers external fetches with no auth. The host is fixed (Wikipedia/Pexels) so it's not a true open SSRF, and OG text is React-escaped (no XSS), but both are uncapped, unauthenticated egress endpoints — easy to turn into a free image-fetch/bandwidth amplifier. At minimum, rate-limit them and validate `img` against an allowlist of expected hosts.

---

## 🟡 Medium — quality & correctness

### 9. AI-error classification by substring matching is fragile
Both API routes detect error type with `msg.includes('credit') || msg.includes('402')` etc. (`generate-matrix/route.ts:83-88`). This depends on the exact text of SDK error messages, which can change between SDK versions and will silently misclassify (a real "credits exhausted" shown as a generic error). The Anthropic SDK throws typed errors with a `.status` field — branch on `err.status` (402/429/529) and `err instanceof Anthropic.APIError` instead.

### 10. `message.content[0]` is unguarded against an empty content array
`generate-matrix`, `suggest-scores`, `suggest-options` all do `message.content[0].type`. If `content` is ever empty, this throws before your nice error handling. Cheap to guard: `message.content[0]?.type === 'text' ? … : ''`.

### 11. Side effect inside a state updater
`updateScore` (`DecisionMaker.tsx:291-305`) calls `trackEvent(...)` **inside** the `setScores` updater. Updaters must be pure — under StrictMode/concurrent rendering React may invoke them twice, double-firing the analytics event. Move the `trackEvent` call outside the updater.

### 12. Analytics depends on a window global with fragile init ordering
`Analytics.tsx` assigns `window.posthog = posthog` in an effect, and `lib/analytics.ts` reads `(window as any).posthog`. Any event fired before that effect runs is silently dropped, and the whole thing leans on effect ordering between sibling subtrees in `layout.tsx`. It mostly works today, but it's brittle. Prefer importing `posthog` directly in `analytics.ts` (it's already a dependency) and calling `posthog.capture` — no window hand-off, no ordering race.

### 13. Auto-save effect has a suppressed dependency and silent fragility
`DecisionMaker.tsx:353-358` auto-saves when `step === 5`, with `eslint-disable react-hooks/exhaustive-deps`. It works because of the `saving || savedId` guard in `handleSave`, but the disabled lint rule hides the coupling. Consider triggering the save explicitly in the `setStep(5)` handler instead of reacting to a step change.

### 14. Inconsistent score rounding shown to users
Winner card shows `maxScore.toFixed(1)` (e.g. 78.4) but the share text and OG badge use `.toFixed(0)` (78). Same number, two values depending on surface. Pick one.

### 15. Middleware runs an auth network round-trip on essentially every request
`middleware.ts` calls `supabase.auth.getUser()` for all matched routes including public/logged-out traffic, adding latency to every navigation and static-ish page. Consider tightening the matcher to only the routes that actually need a session refresh (or use `getSession()` semantics where appropriate).

### 16. Dead/unsurfaced feature: `share_anonymously`
The column is written (always `false`), typed in `DecisionRecord`, and never read or exposed in the UI. Either wire it up or drop it — dead schema fields rot.

---

## 🟢 Maintainability

- **`DecisionMaker.tsx` is 1,217 lines and does everything** — five screens, the share modal, the scoring table (built imperatively with `React.createElement`), all state, and all styling. This is the highest-leverage refactor: split per screen (`<InputScreen>`, `<MatrixScreen>`, `<ScoringScreen>`, `<ResultScreen>`, `<ShareModal>`) and lift the scoring math into a hook. It will also make #5/#6 easier to contain.
- **The share modal is duplicated** almost verbatim (~90 lines) between `DecisionMaker.tsx` and `history/[id]/page.tsx`. Extract one `<ShareModal decision={…} />`.
- **Types are duplicated**: `Criterion`/`Option` live in `DecisionMaker.tsx` and again as `DecisionRecord` in `decisions.ts`. Define them once in `lib/` and import.
- **Styling is 100% inline objects.** It works and is internally consistent, but the color palette (`#2D6A4F`, `#52B788`, `#F9F7F4`, …) and font stacks are re-typed hundreds of times. Pull the palette into CSS variables or a tokens module so a rebrand isn't a find-and-replace across 2,000 lines. Inline style objects also re-allocate every render (minor perf).
- **Font loading is inconsistent.** `layout.tsx` correctly uses `<link rel="preconnect">` + stylesheet, but `history`, `history/[id]`, and `auth` pages re-load fonts via render-blocking `@import` inside inline `<style>` — double-loading and causing FOUT. Standardize on `next/font` (self-hosted, no layout shift, faster) and delete the per-page imports.
- **`React.createElement` scoring table** (`buildScoringTable`, ~120 lines) is rebuilt on every keystroke and is far harder to read than JSX. Convert to a memoized JSX component.

---

## ⚪ Comments & readability

Comments are actually a strong point here — `analytics.ts`, `wiki-image/route.ts`, the middleware, and the auth callback all have clear intent-level comments, and the section-banner style in `DecisionMaker.tsx` aids navigation. Gaps worth filling:

- The **scoring formula** (`score/5 × weight`, and what an unset 0 means) is the conceptual heart of the app and is uncommented in both `DecisionMaker.tsx` and `history/[id]`. Document it once, near a shared helper.
- The **`/share` bot-vs-human redirect trick** (`window.location.replace('/')` so JS-less scrapers read OG tags) is clever and non-obvious; the comment is good but should warn that it also redirects JS-running crawlers (SEO implication).
- No top-level **README / architecture note** and no `.env.example` documenting the required vars (`ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_*`, `NEXT_PUBLIC_POSTHOG_*`, `NEXT_PUBLIC_APP_URL`, optional `PEXELS_API_KEY`). Add both for onboarding and deploy safety.

---

## Testing & ops gaps (none present today)

- **Zero automated tests.** At minimum, unit-test the scoring math and weight normalization (pure functions, high value, easy), and add one integration test per API route asserting the 401-when-unauthenticated path and the JSON-parse-failure path.
- **No error monitoring** (Sentry or equivalent). Your API routes `console.error` into the void; in prod you won't see failures.
- **No `robots.txt` / canonical** — `/share` and `/share-debug` are crawlable. Add a `robots` route and remove the debug page.
- Stray **`Decide.dc.html` (41 KB)** sits at the workspace root — looks like a design export; keep it out of the deployable app dir.

---

## Accessibility (launch-quality polish)

- Scoring dots are `<button>`s with `title` but no `aria-label` / `aria-pressed`; screen readers can't tell state.
- Range inputs (`criteria weights`) have no associated `<label>`.
- Both modals (`SignInModal`, share sheets) lack `role="dialog"`, focus trapping, and `Escape`-to-close.
- `#9B9B9B` text on `#F9F7F4` is below WCAG AA contrast.

---

## Category summary (your 7 asks)

1. **Architecture** — Sound and idiomatic for App Router. Clean separation in `lib/`, good analytics abstraction. Main weaknesses: the 1,200-line god component, duplicated modal/types, and authorization that lives only in DB policy rather than the app.
2. **Bugs** — Weights-not-summing-to-100 making "/100" wrong (#3); compare-mode crash (#5); side-effect-in-updater double-fire (#11); rounding inconsistency (#14); unguarded `content[0]` (#10).
3. **Expected failures** — AI returning non-100 weights / empty content; error responses in compare mode; missing `metadataBase` env breaking previews; clipboard failure swallowed silently.
4. **Performance issues** — Auth round-trip in middleware on every request (#15); double font loading via `@import`; per-render style/`createElement` allocation; no memoization of the scoring table.
5. **Performance improvements** — `next/font`, CSS variables/tokens, memoized components, tighter middleware matcher, edge-cache the OG/wiki responses (you already set `revalidate: 3600` on the upstream fetch — good).
6. **Maintainability** — Split the god component, dedupe the share modal and types, centralize the palette, swap string-matched error handling for typed `.status` checks.
7. **Comments/understandability** — Above average; add scoring-formula docs, a README, and `.env.example`.

**Bottom line:** fix #1–#4 before you ship. #5–#8 the same week. Everything below is real but won't hurt users on day one.
