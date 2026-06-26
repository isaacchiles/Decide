# AskHoot — Product Backlog

Last updated: 2026-06-26 (Batch 3 shipped 2026-06-26)

---

## Legend

| Priority | Label |
|----------|-------|
| 🔴 High | Data quality / legal / security impact |
| 🟡 Medium-High | User-facing; affects trust or conversion |
| 🟢 Medium | Meaningful improvement, no urgency |
| ⚪ Low / Parked | Good idea, revisit later |

---

## 🟡 Medium-High Priority

### [BKL-021] Ghost Blog at blog.askhoot.ai

**Title:** Launch visual blog on Ghost Pro before public launch

**Description:**
Set up Ghost Pro at `blog.askhoot.ai` (subdomain). Write 3–4 posts before going public. Content focus: decision-specific, search-intent-matched pieces ("How to choose between two job offers," "The 7 criteria that matter most when buying a used car"). Natural CTA into the app on each post.

**Acceptance Criteria:**
- [ ] Ghost Pro account created, connected to `blog.askhoot.ai` via Cloudflare DNS
- [ ] AskHoot branding applied (logo, colors, custom domain)
- [ ] 3–4 posts published before public launch
- [ ] Each post links back to askhoot.ai with a CTA ("Try it free →")
- [ ] blog.askhoot.ai added to sitemap.xml and resubmitted to Search Console

**Notes / Dependencies:**
- Ghost Pro at $9/mo — simple, visual, no build work
- Migrate to headless (Next.js `/blog` route) later if SEO warrants it
- Content strategy matters more than platform: specific decision topics > generic "about decisions" posts

---

## 🟢 Medium Priority

### [BKL-004] Enhanced Option Input Mode (User-Provided Data)

**Title:** Add structured input mode for decisions with private user data (e.g., job offers)

**Description:**
"Choosing between job offers" is AskHoot's original use case, but the user has private information (salary, benefits, culture) that AI can't know. Add a mode where users input details per option and AI scores each against the weighted criteria.

**Acceptance Criteria:**
- [ ] Design "enhanced option input" UI — allow pasting job description, salary, key details per option
- [ ] AI uses provided details to score each option against criteria
- [ ] Works alongside existing AI-generated options flow

**Notes / Dependencies:**
- This is the original "weighted scorecard" use case
- Requires UX design decision before build

---

### [BKL-005] Multi-Retailer Affiliate Routing (v2) ⚪ PARKED

**Title:** Route affiliate links by product category (Best Buy, Target, Walmart)

**Description:**
v1 uses Amazon only (universal). v2 routes by product category: electronics → Best Buy/Amazon, home/apparel → Target/Walmart, general → Amazon.

**Decision (2026-06-26):** Parked. Amazon is universal and already wired. Target/Walmart require separate applications, SDK changes, and commission rates are comparable or lower. Not worth the complexity until PostHog affiliate click data shows a category converting heavily where Amazon is weak. If that signal appears, the move is Best Buy (electronics), not Target/Walmart.

**Revisit:** Month 6+ with affiliate click data by vertical.

**Notes / Dependencies:**
- Do not pursue truly regional retailers
- Related: BKL-006 (Amazon Associates — done)

---

### [BKL-018] Ongoing Engagement Email Sequence for Active Users

**Title:** Post-welcome email flow for users who return and make multiple decisions

**Description:**
The welcome sequence handles all new users through their first decision and a 2-week re-engagement window. But active users who keep using AskHoot fall out of all email communication after the welcome flow ends. This ticket adds an ongoing engagement sequence for users who have made 2+ decisions and gone quiet for 30 days.

**Acceptance Criteria:**
- [ ] Define trigger: `decision.completed` where `decisions_count >= 2` + no activity for 30 days
- [ ] Write re-engagement email (B3) — tone differs from welcome-flow re-engagement; acknowledges they're an experienced user ("You've used AskHoot before — got a big decision coming up?")
- [ ] Wire trigger in Resend (separate automation from welcome sequence)
- [ ] Confirm it doesn't fire for users already in the welcome sequence window

**Notes / Dependencies:**
- Copy should reference their history of use, not treat them as new
- Consider personalization using `ai_vertical` from last decision (e.g., "Last time you chose between laptops — what's next?")
- Low urgency until user base is large enough to segment meaningfully
- Related: BKL-012 (profiles/consent), Resend integration

---

## ⚪ Parked / Needs Design Decision

### [BKL-007] Financial / Insurance Affiliate Verticals

**Title:** Handle financial product decisions (insurance, credit cards, loans)

**Description:**
These verticals need specific user attributes (age, state, vehicle, income, credit score) for affiliate referrals to convert. Without them, link conversion is near-zero.

**Options to evaluate:**
1. Add structured sub-step to collect required attributes before generating the matrix
2. Route to a meta-comparison site (The Zebra for auto insurance, NerdWallet for credit cards)
3. Show the CTA but prompt the user to search with their specific info

**Notes / Dependencies:**
- For insurance/financial, the matrix adds less value than for products — there's no "weighing" options when the main output is the best rate for a specific profile
- No build yet — needs decision

---

### [BKL-008] Share Loop — Category-Primed Landing Pages

**Title:** Create category-primed landing pages for users who arrive via share links

**Description:**
When a user shares a decision result, the recipient lands on a pre-filled or context-aware page that primes the decision category, reducing drop-off. Instead of a cold homepage, they'd see: "Your friend just made a car-buying decision — want to make yours?"

**Note (2026-06-26):** Share tracking IS already live — `utm_source=share` fires in PostHog on every share link click. This ticket is not about tracking; it's about improving conversion of that traffic. Build only when PostHog shows meaningful share→visit volume.

**Notes / Dependencies:**
- Share UTM tracking already live — check PostHog "AskHoot Core Metrics" for share-driven visits
- Do not build until share volume justifies it

---

### [BKL-009] Affiliate CPA Postback (Phase 3)

**Title:** Wire CPA network postback to `affiliate_conversions` table

**Description:**
Stub exists at `app/api/affiliate/postback/route.ts`. Connect to CPA network postback flow to track affiliate conversions.

**Notes / Dependencies:**
- Blocked by: active affiliate program approvals (BKL-006)

---

### [BKL-019] Self-Serve Account Deletion Flow

**Title:** Let users delete their own account and data without emailing

**Description:**
The privacy policy currently directs users to email for account deletion. Build a self-serve flow that deletes their profile, all saved decisions, and their Supabase auth record.

**Acceptance Criteria:**
- [ ] Add "Delete my account" option in history/profile area
- [ ] Require explicit confirmation (two-step or type "DELETE")
- [ ] Delete all rows in `public.decisions` for the user
- [ ] Delete the `public.profiles` row
- [ ] Delete the Supabase auth user record (service role key — server-side only)
- [ ] Sign the user out and redirect to home
- [ ] Remove contact from Resend on deletion
- [ ] Update privacy policy to reflect self-serve flow once live

**Notes / Dependencies:**
- Supabase auth user deletion requires `SUPABASE_SERVICE_ROLE_KEY` — never expose client-side
- Related: BKL-020 (data export)

---

### [BKL-020] Data Access and Export Flow

**Title:** Let users request or download a copy of their data

**Description:**
Covers data access and correction — either a self-serve export or email-based request flow.

**Acceptance Criteria:**
- [ ] Define scope: decision history (title, winner, score, date), email, consent preferences
- [ ] Option A: self-serve JSON/CSV export from history page (preferred long-term)
- [ ] Option B: email-based request with 30-day SLA (acceptable now)
- [ ] Update privacy policy once self-serve export is available

**Notes / Dependencies:**
- Option B is acceptable at current scale
- Related: BKL-019 (account deletion)

---

## ✅ Completed

### [BKL-001] PostHog Managed Reverse Proxy
- **Done** — Proxy routes through `e.askhoot.ai` via Cloudflare. SDK updated with `api_host`/`ui_host` split. Vercel env vars configured.

### [BKL-002] PHI / Sensitive Data Disclaimer
- **Done** — Amber callout on `/about` and `/privacy`. Decision: no inline field-level warning (not standard practice; privacy policy is the legal protection).

### [BKL-003] Privacy Policy
- **Done** — Standalone `/privacy` page live. Plain-English, accurate disclosures for all partners. AI observability disclosure added (decision text does reach PostHog via AI traces). PHI section included. Linked from `/about` footer and sitemap.

### [BKL-006] Amazon Associates
- **Done** — Tag `askhoot-20` wired into all affiliate links via `NEXT_PUBLIC_AMAZON_ASSOC_TAG`. `ascsubtag` (decision ID) appended for per-decision attribution.

### [BKL-010] Pexels API Key
- **Done** — `PEXELS_API_KEY` added to Vercel environment variables.

### [BKL-011] PostHog AI Observability
- **Done** — `@posthog/ai/anthropic` wrapping all 3 Claude API routes. `decision_id` on all events. `posthog.identify()` on auth.

### [BKL-012] `public.profiles` + Marketing Consent
- **Done** — Migration applied. Trigger auto-creates profiles. `updateMarketingConsent` wired to `applyPendingConsent` in `Analytics.tsx`.

### [BKL-013] Custom SMTP via Resend
- **Done** — Bypasses Supabase 2 auth emails/hour limit.

### [BKL-014] Magic Link Redirect → askhoot.ai
- **Done** — Supabase Site URL and Redirect URL updated.

### [BKL-015] AskHoot Rebrand + Owl Logo
- **Done** — Branding in all locations including share card wordmark, body copy, and affiliate disclosure (fixed in Batch 1).

### [BKL-016] SEO Foundation
- **Done** — `app/robots.ts`, `app/sitemap.ts`, `public/llms.txt` deployed. `/privacy` added to sitemap. Submit `https://askhoot.ai/sitemap.xml` to Google Search Console if not yet done.

### [BKL-017] Highlight "Try an Example" Button
- **Done** — Button styled with `background: #E8F5EE`, `color: #2D6A4F`, `border: 1px solid #B7DFC9`.

### Resend Email Integration
- **Done** — `lib/resend.ts`, `/api/resend-contact`, `/api/resend-event`. Fires `user.signed_up` on consent + `decision.completed` on save. Sequence A (welcome + nudge) and Sequence B (follow-up + re-engagement) configured in Resend dashboard.

### Analytics Deep-Dive
- **Done** — `user_signed_up` (first login detection), `decision_abandoned` (beforeunload with step), `ai_vertical` on `constraint_added` / `preference_added` / `criteria_weight_adjusted`, share UTM params (`utm_source=share`). PostHog dashboard "AskHoot Core Metrics" live with 13 insights.

### Code Review 2 — Batch 1 Tightening (CR-103/105/106/111/112/113/116)
- **Done** — All "Do immediately" items from CODE_REVIEW_2.md shipped in one commit:
  - CR-103: "decide" literals replaced with "AskHoot"/"askhoot.ai" in share card, body copy, and affiliate disclosure
  - CR-105: Exact Amazon Associates required phrase added to AffiliateCTA
  - CR-106: `ascsubtag` appended to all Amazon URLs for decision-level attribution
  - CR-111: Misleading comment in `lib/profile.ts` corrected to match actual behavior
  - CR-112: Contribution bars normalized to match headline score math
  - CR-113: Misleading weight badge removed (normalization renders it meaningless)
  - CR-116: Dead `/share-debug` allowlist entry removed from `middleware.ts`

### Code Review 2 — Batch 2 Hardening (CR-101/102/107/108)
- **Done** — All "Do before launch" items shipped; type-check clean. Two manual steps required (see below):
  - CR-107: `ErrorBoundary` moved to `app/layout.tsx` (wraps `{children}`); removed from `app/page.tsx`. All routes now covered.
  - CR-108: `CLAUDE.md` refreshed — AskHoot/askhoot.ai, prod URL, all new infra documented, share-debug noted as auth-gated.
  - CR-102: `app/api/og/route.tsx` now validates the `img` param against a host allowlist (Pexels, Wikimedia, askhoot.ai, `*.supabase.co`); returns 400 otherwise. https-only.
  - CR-101: `lib/ratelimit.ts` rewritten to a single atomic `increment_api_usage` RPC; explicit **fail-open** policy. New `api_usage_ratelimit_migration.sql` + `BUDGET_ALARM.md`.
  - ⚠️ **Manual before launch:** (1) run `api_usage_ratelimit_migration.sql` in Supabase SQL editor; (2) set the Anthropic Console spend limit + PostHog alert per `BUDGET_ALARM.md`.

### Batch 3 — Launch Readiness (2026-06-26)
- **Done** — type-check clean.
  - **404 page:** `app/not-found.tsx` — AskHoot-branded, "Start a new decision →" CTA, fires `page_not_found` PostHog event with the path so broken URLs are tracked.
  - **BKL-019 (Account deletion):** Full cascade delete — decisions → profiles → Resend (`user.deleted` event) → Supabase auth user. Two-step confirmation UI in `/history`. Powered by new `app/api/delete-account/route.ts` (service role) and `lib/supabase/admin.ts`.
  - **Analytics:** Added `page_not_found` and `account_deleted` to `AnalyticsEvent` type.

### Vertical Landing Pages (BKL-022) — v2, Parked
- `/auto`, `/laptop`, `/credit-card`, etc. — template system for vertical-specific landing pages with pre-filled context fields and SEO copy. Also resolves BKL-007 (financial verticals) as a side effect. **Do not build until blog + share data establishes organic intent signals.**

### Amazon Associates — Confirmed Ready
- Tag `askhoot-20` wired. Program approved. Amazon reviews performance once meaningful traffic is live — nothing to do but launch.
