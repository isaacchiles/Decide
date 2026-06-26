# AskHoot — Product Backlog

Last updated: 2026-06-25

---

## Legend

| Priority | Label |
|----------|-------|
| 🔴 High | Data quality / legal / security impact |
| 🟡 Medium-High | User-facing; affects trust or conversion |
| 🟢 Medium | Meaningful improvement, no urgency |
| ⚪ Low / Parked | Good idea, revisit later |

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

### [BKL-005] Multi-Retailer Affiliate Routing (v2)

**Title:** Route affiliate links by product category (Best Buy, Target, Walmart)

**Description:**
v1 uses Amazon only (universal). v2 routes by product category: electronics → Best Buy/Amazon, home/apparel → Target/Walmart, general → Amazon.

**Acceptance Criteria:**
- [ ] Implement category detection on decision type
- [ ] Route to highest-converting affiliate per category
- [ ] Support "I prefer Walmart/Target" user preference signal
- [ ] Never show multiple CTA buttons — always a single best link

**Notes / Dependencies:**
- Apply to Walmart (Impact Radius) and Target (Impact) affiliate programs
- Do not pursue truly regional retailers
- Related: BKL-006 (Amazon Associates application)

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
When a user shares a decision result, the recipient lands on a pre-filled or context-aware page that primes the decision category, reducing drop-off.

**Notes / Dependencies:**
- Depends on share link infrastructure already existing
- Share UTM tracking now live (`utm_source=share`) so we can measure share→visit volume before building this

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
- **Done** — Tag `askhoot-20` wired into all affiliate links via `NEXT_PUBLIC_AMAZON_ASSOC_TAG`. Site has live traffic and content.

### [BKL-010] Pexels API Key
- **Pending** — `PEXELS_API_KEY` still needs to be added to Vercel environment variables.

### [BKL-011] PostHog AI Observability
- **Done** — `@posthog/ai/anthropic` wrapping all 3 Claude API routes. `decision_id` on all events. `posthog.identify()` on auth.

### [BKL-012] `public.profiles` + Marketing Consent
- **Done** — Migration applied. Trigger auto-creates profiles. `updateMarketingConsent` wired to `applyPendingConsent` in `Analytics.tsx`.

### [BKL-013] Custom SMTP via Resend
- **Done** — Bypasses Supabase 2 auth emails/hour limit.

### [BKL-014] Magic Link Redirect → askhoot.ai
- **Done** — Supabase Site URL and Redirect URL updated.

### [BKL-015] AskHoot Rebrand + Owl Logo
- **Done** — Branding in all locations. Owl in loading state, sign-in modal, history empty state, step 5 winner reveal.

### [BKL-016] SEO Foundation
- **Done** — `app/robots.ts`, `app/sitemap.ts`, `public/llms.txt` deployed. `/privacy` added to sitemap. Submit `https://askhoot.ai/sitemap.xml` to Google Search Console if not yet done.

### [BKL-017] Highlight "Try an Example" Button
- **Done** — Button styled with `background: #E8F5EE`, `color: #2D6A4F`, `border: 1px solid #B7DFC9`.

### Resend Email Integration
- **Done** — `lib/resend.ts`, `/api/resend-contact`, `/api/resend-event`. Fires `user.signed_up` on consent + `decision.completed` on save. Sequence A (welcome + nudge) and Sequence B (follow-up + re-engagement) configured in Resend dashboard.

### Analytics Deep-Dive
- **Done** — `user_signed_up` (first login detection), `decision_abandoned` (beforeunload with step), `ai_vertical` on `constraint_added` / `preference_added` / `criteria_weight_adjusted`, share UTM params (`utm_source=share`). PostHog dashboard "AskHoot Core Metrics" live with 13 insights.
