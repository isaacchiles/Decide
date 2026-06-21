# decide — AI-powered weighted decision maker

## Stack
- Next.js 14 App Router + TypeScript
- Supabase (magic link auth + Postgres + RLS)
- Anthropic Claude Sonnet 4.6
- PostHog analytics
- Vercel (production: https://decide-woad.vercel.app)
- Fonts: Fraunces (display) + DM Sans (body)
- Brand colors: #2D6A4F (dark green), #52B788 (mid green), #E9C46A (gold), #F9F7F4 (cream bg)

## Key files
- `components/DecisionMaker.tsx` — all 5-screen UI (input, loading, matrix, scoring, results)
- `app/api/generate-matrix/route.ts` — AI criteria + options generation
- `app/api/suggest-scores/route.ts` — AI scoring
- `app/api/suggest-options/route.ts` — AI "suggest more options" (3/decision limit)
- `app/api/wiki-image/route.ts` — server-side Wikipedia image proxy
- `app/api/og/route.tsx` — OG image generation (1200×630)
- `app/history/page.tsx` — saved decisions list
- `app/history/[id]/page.tsx` — decision detail + share
- `app/share/page.tsx` — OG tag page for iMessage/social previews
- `app/share-debug/page.tsx` — diagnostic page for share/OG debugging
- `lib/decisions.ts` — Supabase CRUD helpers
- `lib/analytics.ts` — PostHog event wrappers
- `lib/wikipedia.ts` — Wikipedia image fetch (calls /api/wiki-image)
- `lib/templates.ts` — decision templates (car, home, job, etc.)
- `middleware.ts` — Supabase auth; public routes: /, /share, /share-debug, /api/*

## Git rule
Never commit from the sandbox. Always give terminal commands for Isaac to run.

## Backlog (post-MVP)
- Rename/retitle saved decisions
- Re-run a saved decision with updated constraints or new AI suggestions
- Mobile keyboard handling (inputs jump when iOS keyboard appears)
- OG image for root URL (when sharing https://decide-woad.vercel.app directly)
