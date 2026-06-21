/**
 * analytics.ts — Tier 1 behavioral telemetry abstraction
 *
 * ALL analytics calls in the app go through trackEvent() here.
 * To swap PostHog for another provider, or add a second one,
 * change only this file — nothing else in the codebase needs to change.
 *
 * Privacy rules (enforced here, not in components):
 *   ✅ Track: screen names, counts, timings, boolean flags
 *   ❌ Never track: decision text, constraint/preference text,
 *                   option names, criteria names, any user-entered content
 */

// ── Event catalogue ──────────────────────────────────────────────────────────
// Add new event names here as the app grows. TypeScript will enforce
// that only known event names are passed to trackEvent().

export type AnalyticsEvent =
  | 'screen_viewed'
  | 'decision_started'          // CTA clicked on Screen 1
  | 'constraint_added'
  | 'preference_added'
  | 'constraint_removed'
  | 'preference_removed'
  | 'matrix_generation_started'
  | 'matrix_generation_succeeded'
  | 'matrix_generation_failed'
  | 'criteria_weight_adjusted'  // user moved a slider
  | 'option_added'              // user typed their own option
  | 'ai_suggest_more_clicked'   // "Let AI suggest more" button
  | 'scoring_started'           // entered Screen 4
  | 'score_set'                 // user tapped a dot
  | 'recommendation_viewed'     // reached Screen 5
  | 'decision_restarted'        // "Start a New Decision"
  | 'decision_saved'            // auto-save succeeded
  | 'ai_scores_applied'         // AI pre-filled the scoring dots
  | 'decision_shared';          // user tapped Share My Decision

// ── Property types ───────────────────────────────────────────────────────────
// Only primitives — never strings that could contain user content.

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | undefined
>;

// ── Core function ────────────────────────────────────────────────────────────

export function trackEvent(
  event: AnalyticsEvent,
  properties?: AnalyticsProperties
): void {
  if (typeof window === 'undefined') return; // SSR guard

  // PostHog
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ph = (window as any).posthog;
  if (ph?.capture) {
    ph.capture(event, properties ?? {});
  }

  // ── Add additional providers here ────────────────────────────────────────
  // Mixpanel example:
  // const mp = (window as any).mixpanel;
  // if (mp?.track) mp.track(event, properties ?? {});
  //
  // Amplitude example:
  // const amp = (window as any).amplitude;
  // if (amp?.track) amp.track(event, properties ?? {});
  // ─────────────────────────────────────────────────────────────────────────

  // Development logging — remove or gate behind env var if noisy
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, properties ?? {});
  }
}
