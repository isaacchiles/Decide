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

// Import posthog-js directly so events are queued even if they fire
// before Analytics.tsx's useEffect has called posthog.init().
// posthog-js is a singleton — the same instance is used everywhere.
import posthog from 'posthog-js';

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
  | 'decision_shared'           // user tapped Share My Decision
  | 'template_applied'          // user selected a template on Screen 1
  | 'affiliate_click';          // user clicked an affiliate CTA (vertical, partner, position)

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

  // PostHog — posthog-js queues events internally until init() completes,
  // so this fires reliably even if called before Analytics.tsx has mounted.
  if (posthog?.capture) {
    posthog.capture(event, properties ?? {});
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
