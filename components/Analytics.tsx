'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';
import { createClient } from '@/lib/supabase/client';
import { updateMarketingConsent } from '@/lib/profile';
import { trackEvent } from '@/lib/analytics';

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

    // Fire once per browser session for attribution.
    // sessionStorage is cleared when the tab closes, so this re-fires
    // on every new visit but not on same-session page navigations.
    if (!sessionStorage.getItem('ph_session_started')) {
      sessionStorage.setItem('ph_session_started', '1');
      const params = new URLSearchParams(window.location.search);
      trackEvent('decision_session_started', {
        referrer:     document.referrer || undefined,
        utm_source:   params.get('utm_source')   ?? undefined,
        utm_medium:   params.get('utm_medium')   ?? undefined,
        utm_campaign: params.get('utm_campaign') ?? undefined,
      });
    }

    // Helper: consume any pending marketing consent from localStorage.
    // Called on initial load AND on SIGNED_IN so it's covered regardless
    // of whether the magic link redirect fires INITIAL_SESSION or SIGNED_IN.
    function applyPendingConsent() {
      const pending = localStorage.getItem('askhoot_marketing_consent');
      if (pending !== null) {
        updateMarketingConsent(pending === 'true');
        localStorage.removeItem('askhoot_marketing_consent');
      }
    }

    // Identify authenticated users so browser events and server-side
    // $ai_generation events share the same distinct_id.
    const supabase = createClient();

    // On initial load: identify and apply any pending consent.
    // This covers returning users who arrive via magic link redirect,
    // where the session is already established (INITIAL_SESSION fires, not SIGNED_IN).
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        posthog.identify(user.id, { email: user.email });
        applyPendingConsent();
      }
    });

    // Keep identity in sync if the user signs in or out during the session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        posthog.identify(session.user.id, { email: session.user.email });
        if (event === 'SIGNED_IN') applyPendingConsent();
      } else {
        posthog.reset(); // clear identity on sign-out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null; // renders nothing
}
