'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

/**
 * Analytics — initializes PostHog once on the client side.
 * Rendered in app/layout.tsx so it's active on every page.
 *
 * To swap providers: replace the posthog.init() call here.
 * The trackEvent() abstraction in lib/analytics.ts remains unchanged.
 */
export default function Analytics() {
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

    if (!key) {
      // No key in env — skip silently (e.g. local dev without PostHog)
      return;
    }

    posthog.init(key, {
      api_host: host,

      // Don't track on first load — wait for explicit capture() calls.
      // This prevents auto-capturing page views with URL params that
      // could leak sensitive query strings.
      capture_pageview: false,

      // Respect Do Not Track browser setting
      respect_dnt: true,

      // Session recordings are off by default.
      // Enable in PostHog dashboard only after reviewing what's on screen.
      disable_session_recording: true,

      // Don't send feature flag requests on init — reduces noise
      advanced_disable_decide: false,

      // Persistence: use localStorage so sessions survive page refreshes
      persistence: 'localStorage',
    });

    // Expose posthog on window so lib/analytics.ts can reach it
    // without importing posthog-js in every component
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).posthog = posthog;
  }, []);

  return null; // renders nothing
}
