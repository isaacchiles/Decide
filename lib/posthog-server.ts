/**
 * posthog-server.ts — server-side PostHog singleton.
 *
 * Used by API routes to capture $ai_generation events via @posthog/ai.
 * The browser-side client (posthog-js) is initialized separately in Analytics.tsx.
 *
 * Must use the same project key as the browser client so that server-side
 * $ai_generation events are linked to the correct PostHog project.
 */

import { PostHog } from 'posthog-node';

const key  = process.env.NEXT_PUBLIC_POSTHOG_KEY  ?? '';
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// Module-level singleton — reused across requests in the same Node.js process.
// In Edge/serverless environments a new instance is created per invocation,
// which is fine — the flushAt/flushInterval below ensures events are sent
// before the function terminates.
export const posthogServer = key
  ? new PostHog(key, {
      host,
      flushAt: 1,       // send immediately — important for short-lived serverless fns
      flushInterval: 0, // don't batch; flush on every event
    })
  : null;
