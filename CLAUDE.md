# AskHoot — AI-powered weighted decision maker

User describes a decision, adds constraints/preferences, Claude generates weighted
criteria, the user scores options, and AskHoot returns a ranked recommendation.
Product-vertical decisions surface an Amazon Associates affiliate CTA.

## Stack
- Next.js 14 App Router + TypeScript
- Supabase (magic link auth + Postgres + RLS)
- Anthropic Claude Sonnet 4.6
- PostHog (product analytics + AI observability via `@posthog/ai/anthropic`)
- Resend (transactional/lifecycle email automations)
- Amazon Associates (affiliate program)
- Vercel (production: https://askhoot.ai)
- Fonts: Fraunces (display) + DM Sans (body)
- Brand colors: #2D6A4F (dark green), #52B788 (mid green), #E9C46A (gold), #F9F7F4 (cream bg)

## Key files

### UI / pages
- `components/DecisionMaker.tsx` — all 5-screen UI (input, loading, matrix, scoring, results)
- `components/AffiliateCTA.tsx` — affiliate button + Amazon Associates disclosure
- `components/ErrorBoundary.tsx` — app-wide crash boundary (mounted in `app/layout.tsx`)
- `components/SignInModal.tsx` — magic-link sign-in
- `components/Analytics.tsx` — browser PostHog init + post-auth profile sync
- `app/history/page.tsx` — saved decisions list
- `app/history/[id]/page.tsx` — decision detail + share
- `app/share/page.tsx` — OG tag page for iMessage/social previews
- `app/share-debug/page.tsx` — diagnostic page for share/OG debugging (auth-gated, not public)
- `app/about/page.tsx` — affiliate disclosure + privacy statement
- `app/privacy/page.tsx` — privacy policy

### API routes (`app/api/`)
- `generate-matrix/route.ts` — Claude criteria + options generation; classifies vertical
- `suggest-scores/route.ts` — AI scoring
- `suggest-options/route.ts` — AI "suggest more options" (3/decision limit)
- `og/route.tsx` — OG image generation (1200×630); `img` param host-allowlisted
- `wiki-image/route.ts` — server-side Wikipedia image proxy
- `resend-contact/route.ts` — upsert contact into Resend audience
- `resend-event/route.ts` — fire lifecycle events (user.signed_up, decision.completed)
- `affiliate/postback/route.ts` — CPA postback stub (Phase 3, not yet wired)

### lib
- `lib/decisions.ts` — Supabase CRUD (saveDraft / saveDecision / loadDecisions / getDecision / deleteDecision)
- `lib/affiliate.ts` — PARTNERS registry, Vertical types, resolveVertical / resolveAffiliate
- `lib/analytics.ts` — PostHog event wrappers + event catalogue
- `lib/posthog-server.ts` — server-side PostHog singleton (captures `$ai_generation`)
- `lib/resend.ts` — Resend client singleton (server-only; needs `RESEND_API_KEY`)
- `lib/profile.ts` — helpers for the `public.profiles` table (marketing consent, plan)
- `lib/ratelimit.ts` — per-user daily API rate limiting via Supabase
- `lib/brand.ts` — centralized name/color/tagline config
- `lib/templates.ts` — decision templates (car, home, job, etc.)
- `lib/wikipedia.ts` — Wikipedia image fetch (calls /api/wiki-image)
- `lib/supabase/{client,server}.ts` — Supabase client factories

### Infra / config
- `middleware.ts` — Supabase auth refresh; public routes: `/`, `/auth/*`, `/api/*`, `/share*`
- `supabase` schema additions in `affiliate_vertical_migration.sql`

## Data model notes
- `decisions` — saved decisions; RLS scoped to `auth.uid()`. Draft→complete: `saveDraft()`
  inserts `status='draft'`, `saveDecision()` updates to `status='complete'`.
- `profiles` — auto-created by a Supabase trigger on signup; holds marketing consent, plan.
- `api_usage` — per-user/endpoint/day counters backing `lib/ratelimit.ts`.

## Git rule
**Never commit from the sandbox. Always give terminal commands for Isaac to run.**
(Previous sessions had commits stuck local-only and Vercel never deployed. Always
`git push origin main` after committing.)

## Backlog (post-MVP)
- Rename/retitle saved decisions
- Re-run a saved decision with updated constraints or new AI suggestions
- Mobile keyboard handling (inputs jump when iOS keyboard appears)
- OG image for root URL (when sharing https://askhoot.ai directly)
- Multi-retailer affiliate routing (Walmart/Target/Best Buy) — Phase 2
- Enhanced option input (user-provided per-option details for job-offer use case)
