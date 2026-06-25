'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { createClient } from '@/lib/supabase/client';

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

    // Identify authenticated users so browser events and server-side
    // $ai_generation events share the same distinct_id.
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) posthog.identify(user.id, { email: user.email });
    });

    // Keep identity in sync if the user signs in or out during the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
      } else {
        posthog.reset(); // clear identity on sign-out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null; // renders nothing
}
