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

## 🔴 High Priority

### [BKL-001] Implement PostHog Managed Reverse Proxy

**Title:** Implement PostHog Managed Reverse Proxy for improved event capture

**Description:**
Enable PostHog's Managed Reverse Proxy (via Cloudflare) to route analytics events through a custom subdomain on askhoot.ai. This bypasses ad blockers and is expected to increase captured events by 10–30%. Include the required legal acknowledgment and update SDK configuration.

**Acceptance Criteria:**
- [ ] Create managed proxy record in PostHog organization settings using a neutral subdomain (e.g., `e.askhoot.ai` or `ph.askhoot.ai`)
- [ ] Add corresponding CNAME record in askhoot.ai DNS and confirm propagation + SSL issuance
- [ ] Update PostHog initialization code (`api_host` points to proxy subdomain; `ui_host` remains PostHog domain)
- [ ] Verify in browser dev tools that events route through the custom subdomain with 200 responses
- [ ] Document the change and any monitoring steps in the project repo/wiki
- [ ] Acknowledge PostHog's Managed Proxy terms (including Cloudflare subprocessor and non-HIPAA note)

**Notes / Dependencies:**
- Review Cloudflare DNS settings — disable proxy (orange cloud) for the CNAME
- Test thoroughly before full rollout
- Related: BKL-002 (Privacy disclaimer), BKL-003 (Privacy policy)

---

## 🟡 Medium-High Priority

### [BKL-002] Add User Disclaimer for Sensitive / PHI Data

**Title:** Add user disclaimer warning against inputting PHI / sensitive personal data

**Description:**
Implement visible warnings that AskHoot is not designed to handle Protected Health Information (PHI) or other sensitive data. Especially important given health-related comparison use cases (e.g., GLP-1 medications vs. diet).

**Acceptance Criteria:**
- [ ] Draft and approve 1–2 versions of the disclaimer message (short + contextual)
- [ ] Implement disclaimer in UI (e.g., onboarding modal, persistent note near input, tooltip, or banner)
- [ ] Include similar language in Terms of Service / Privacy Policy
- [ ] Test visibility on desktop + mobile
- [ ] Ensure it does not disrupt user experience

**Notes / Dependencies:**
- Tone: helpful and non-alarming ("for your privacy and safety…")
- Consider dynamic display if health-related keywords are detected
- Related: BKL-001 (PostHog proxy), BKL-003 (Privacy policy)

---

### [BKL-003] Update Privacy Policy and Data Handling Docs

**Title:** Update Privacy Policy and internal docs for PII / PHI handling

**Description:**
Revise privacy-related documentation to clearly address email as PII, prohibition on PHI input, and current data processing (including analytics tools).

**Acceptance Criteria:**
- [ ] Confirm email address is documented as PII
- [ ] Add section on prohibited inputs (PHI/sensitive data) and platform limitations (not HIPAA-compliant)
- [ ] Review and update data retention, sharing, and subprocessor language (PostHog, Cloudflare, Resend, Supabase, etc.)
- [ ] Publish updated policy and notify users if required

**Notes / Dependencies:**
- Keep it user-friendly while accurate
- Can be done in parallel with BKL-002
- Related: BKL-001 (PostHog proxy), BKL-002 (disclaimer)

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

### [BKL-006] Apply to Amazon Associates

**Title:** Submit Amazon Associates application

**Description:**
Requires a live site with content. The `/about` page now exists. Apply via affiliate-program.amazon.com.

**Acceptance Criteria:**
- [X] Confirm site has sufficient content and live traffic
- [X] Submit application
- [X] Wire `NEXT_PUBLIC_AMAZON_ASSOC_TAG` into production affiliate links

**Notes / Dependencies:**
- Pre-requisite: live site with real decisions
- Blocked by: site needs meaningful traffic before approval

---

### [BKL-016] SEO Foundation — robots.txt, sitemap.xml, llms.txt

**Title:** Add robots.txt, sitemap, and llms.txt before SEO push

**Description:**
Prerequisite for any search engine optimization effort. Without these, crawlers index the site arbitrarily and you have no control over what appears in search results or AI training corpora.

**Acceptance Criteria:**
- [ ] Add `app/robots.ts` (generates `/robots.txt`): allow all crawlers on `/`, `/about`, `/share`; disallow `/history`, `/api`, `/auth`
- [ ] Add `app/sitemap.ts` (generates `/sitemap.xml`): include `/`, `/about`; exclude dynamic/auth routes
- [ ] Add `public/llms.txt`: one-paragraph description of AskHoot for AI crawlers (what it does, who it's for, that it's free)
- [ ] Verify all three are accessible in production at the expected URLs
- [ ] Submit sitemap to Google Search Console

**Notes / Dependencies:**
- Next.js 14 App Router has native support for `robots.ts` and `sitemap.ts` — no packages needed
- `llms.txt` is an emerging convention (not a standard yet) — low effort, useful signal
- Do this before any link-building or SEO content work
- Priority: High for SEO readiness

---

### [BKL-017] Highlight "Try an Example" Button During Launch Window

**Title:** Make "Try an example" button more visually prominent on Step 1

**Description:**
The button currently uses a ghost style (no background, gray text, light border) that blends into the label row. During the launch window, users who can't think of a decision to try will drop off — this button is the fix, but they need to see it. A subtle green tint keeps it on-brand.

**Acceptance Criteria:**
- [ ] Update button style: `background: #E8F5EE`, `color: #2D6A4F`, `border: 1px solid #B7DFC9` — stays secondary but visible
- [ ] Confirm it doesn't compete with the primary "Build My Decision Matrix" CTA
- [ ] Test on mobile (button sits in a tight header row)
- [ ] Revisit after launch — may revert to ghost style once there's enough organic traffic

**Notes / Dependencies:**
- Currently: `background: none`, `color: #6B6B6B`, `border: 1px solid #E0DBD3`
- This is a launch-window nudge, not a permanent design decision
- Priority: Medium-High during launch; Low after

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

---

### [BKL-019] Self-Serve Account Deletion Flow

**Title:** Let users delete their own account and data without emailing

**Description:**
The privacy policy currently directs users to email us for account deletion. This is honest but not scalable and creates a manual support burden. Build a self-serve flow in the user's account settings that deletes their profile, all saved decisions, and their Supabase auth record.

**Acceptance Criteria:**
- [ ] Add account settings page (or section within history/profile) with a "Delete my account" option
- [ ] Require explicit confirmation before deletion (e.g., type "DELETE" or a two-step confirm)
- [ ] Delete all rows in `public.decisions` for the user
- [ ] Delete the `public.profiles` row
- [ ] Delete the Supabase auth user record (requires service role key — server-side only)
- [ ] Sign the user out and redirect to home on completion
- [ ] Remove contact from Resend audience on deletion
- [ ] Update privacy policy to reflect self-serve flow once live

**Notes / Dependencies:**
- Supabase auth user deletion requires the service role key (`SUPABASE_SERVICE_ROLE_KEY`) — never expose this client-side
- Consider a 7-day grace period / soft delete before hard deletion (backlog decision)
- Related: BKL-020 (data export)

---

### [BKL-020] Data Access and Export Flow

**Title:** Let users request or download a copy of their data

**Description:**
The privacy policy states users can request a copy of their data, correction of inaccurate data, or deletion. The deletion path will be self-serve (BKL-019). This ticket covers data access and correction — either a self-serve export or a handled request flow.

**Acceptance Criteria:**
- [ ] Define what "a copy of your data" means for AskHoot: decision history (title, winner, score, date), account email, consent preferences
- [ ] Option A: self-serve JSON/CSV export from history page (preferred long-term)
- [ ] Option B: email-based request flow with 30-day SLA (acceptable for now)
- [ ] Correction path: user can edit decision titles; other corrections handled by email request
- [ ] Update privacy policy once self-serve export is available

**Notes / Dependencies:**
- Option B is acceptable at current scale — revisit when user base grows
- Related: BKL-019 (account deletion)

---

### [BKL-009] Affiliate CPA Postback (Phase 3)

**Title:** Wire CPA network postback to `affiliate_conversions` table

**Description:**
Stub exists at `app/api/affiliate/postback/route.ts`. Connect to CPA network postback flow to track affiliate conversions.

**Notes / Dependencies:**
- Blocked by: active affiliate program approvals (BKL-006)

---

## ✅ Completed / In Progress

### [BKL-010] Pexels API Key — Set in Vercel env vars
- Status: **Pending** — `PEXELS_API_KEY` still needs to be added to Vercel environment variables

### [BKL-011] PostHog AI Observability
- Status: **Done** — `@posthog/ai/anthropic` wrapping all 3 Claude API routes; `decision_id` on all events; `posthog.identify()` on auth

### [BKL-012] `public.profiles` table + marketing consent
- Status: **Done** — migration applied, trigger auto-creates profiles, `updateMarketingConsent` wired to `applyPendingConsent` in `Analytics.tsx`

### [BKL-013] Custom SMTP via Resend
- Status: **Done** — bypasses Supabase 2 auth emails/hour limit

### [BKL-014] Magic link redirect → askhoot.ai
- Status: **Done** — Supabase Site URL + Redirect URL updated

### [BKL-015] AskHoot rebrand + owl logo
- Status: **Done** — camelCase branding in all locations; owl in loading state, sign-in modal, history empty state, step 5 winner reveal
