'use client';

import { useEffect, useState } from 'react';
import posthog from 'posthog-js';

/**
 * LaunchGate — kill switch for the main decision flow.
 *
 * Wraps <DecisionMaker /> so that if something breaks after the LinkedIn
 * launch, flipping the `linkedin-launch-rollout` flag to 0% in PostHog
 * instantly pauses new decisions for everyone, without a redeploy.
 *
 * Fails OPEN: if the flag hasn't loaded yet (first paint) or PostHog is
 * unreachable, we show the real app rather than blocking real users on a
 * slow/failed flag fetch. Only an explicit `false` from PostHog pauses it.
 */
export default function LaunchGate({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    if (!key) return; // no PostHog configured (e.g. local dev) — stay open

    function check() {
      const flag = posthog.isFeatureEnabled('linkedin-launch-rollout');
      // undefined = not yet evaluated; only an explicit false pauses the app
      if (flag === false) setEnabled(false);
    }

    posthog.onFeatureFlags(check);
    check();
  }, []);

  if (!enabled) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F9F7F4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px', fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{ textAlign: 'center', maxWidth: '420px' }}>
          <h2 style={{
            fontFamily: "'Fraunces', serif", fontSize: '24px',
            fontWeight: 800, color: '#1A1A1A', margin: '0 0 12px',
          }}>
            We&apos;ll be right back
          </h2>
          <p style={{ fontSize: '15px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>
            AskHoot is briefly paused for maintenance. Please check back shortly.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
