'use client';

import { useEffect, useRef } from 'react';
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
  // Guards against applyPendingConsent() firing twice in THIS tab — it's
  // deliberately called from two listeners below (initial getUser() AND
  // onAuthStateChange SIGNED_IN) to cover both magic-link redirect shapes.
  // Does NOT protect against a second browser tab (e.g. the magic link
  // opening in a new tab while the original stays open) independently
  // reading the same localStorage flag before either clears it — that
  // residual race is closed server-side instead, via the atomic
  // claim_welcome_email() RPC in app/api/resend-contact/route.ts (BKL-024,
  // shipped 2026-07-02 — see CHANGELOG.md).
  const consentApplied = useRef(false);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    // ui_host: PostHog's real domain — used for toolbar and session recordings.
    // api_host: proxy subdomain when available, direct PostHog otherwise.
    //   The proxy (e.askhoot.ai) routes events through Cloudflare so they
    //   aren't blocked by ad blockers. Falls back to direct if not configured.
    const uiHost  = process.env.NEXT_PUBLIC_POSTHOG_HOST  ?? 'https://us.posthog.com';
    const apiHost = process.env.NEXT_PUBLIC_POSTHOG_PROXY_HOST ?? uiHost;

    if (!key) {
      // No key in env — skip silently (e.g. local dev without PostHog)
      return;
    }

    posthog.init(key, {
      api_host: apiHost,
      ui_host:  uiHost,

      // Don't track on first load — wait for explicit capture() calls.
      // This prevents auto-capturing page views with URL params that
      // could leak sensitive query strings.
      capture_pageview: false,

      // Respect Do Not Track browser setting
      respect_dnt: true,

      // Session recordings: ON for the LinkedIn launch (2026-07) so we can see
      // where real users get stuck, beyond what discrete events tell us.
      // Inputs are masked by default (maskAllInputs) so free-text decision/
      // constraint/preference text is NEVER captured in a replay — this keeps
      // us consistent with the "never track user content" rule in lib/analytics.ts.
      disable_session_recording: false,
      session_recording: {
        maskAllInputs: true,
        // '*' masks ALL rendered text, not just <input>/<textarea> fields.
        // Necessary because decision content (AI-generated criteria names,
        // rationales, option names, results) is rendered as plain text
        // throughout the app, not just typed into inputs — a narrower
        // selector would leak it into replays. This trades away seeing
        // *what* users typed/saw in exchange for still seeing *where* they
        // click, scroll, rage-click, and drop off — which is what we
        // actually need pre-launch. Matches the privacy policy's promise
        // that behavioral analytics never carries decision content.
        maskTextSelector: '*',
      },

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
      if (consentApplied.current) return; // already handled in this tab
      const pending = localStorage.getItem('askhoot_marketing_consent');
      if (pending !== null) {
        consentApplied.current = true;
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
        if (event === 'SIGNED_IN') {
          applyPendingConsent();

          // Detect first-ever sign-in: created_at within the last 30 minutes.
          // Returning users have a created_at from a previous session (hours/days ago)
          // so this reliably distinguishes new signups from returning logins.
          const createdAt  = new Date(session.user.created_at).getTime();
          const isNewUser  = Date.now() - createdAt < 30 * 60 * 1000;
          if (isNewUser) {
            const params = new URLSearchParams(window.location.search);
            trackEvent('user_signed_up', {
              utm_source:   params.get('utm_source')   ?? undefined,
              utm_medium:   params.get('utm_medium')   ?? undefined,
              utm_campaign: params.get('utm_campaign') ?? undefined,
            });
          }
        }
      } else {
        posthog.reset(); // clear identity on sign-out
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return null; // renders nothing
}
