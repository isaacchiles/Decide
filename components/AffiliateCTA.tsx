'use client';

import { trackEvent } from '@/lib/analytics';
import type { AffiliateCTA as AffiliateCTAType } from '@/lib/affiliate';

type Props = {
  cta:      AffiliateCTAType;
  position: 'results_primary' | 'history' | 'ranked_row';
};

/**
 * Affiliate call-to-action button with FTC disclosure.
 *
 * Compliance:
 *   - rel="sponsored noopener noreferrer" on all outbound links
 *   - FTC disclosure visible adjacent to every monetized link
 *   - Amazon attribution line shown when partner is Amazon
 *   - Recommendation ranking is never affected by commission (enforced in scoring logic)
 */
export default function AffiliateCTA({ cta, position }: Props) {
  return (
    <div style={{ marginTop: '16px' }}>
      <a
        href={cta.href}
        target="_blank"
        rel="sponsored noopener noreferrer"
        onClick={() =>
          trackEvent('affiliate_click', {
            vertical:    cta.vertical,
            partner:     cta.partnerId,
            position,
            sub_id:      cta.subId,
          })
        }
        style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             '8px',
          padding:         '14px 24px',
          background:      '#2D6A4F',
          color:           'white',
          borderRadius:    '24px',
          textDecoration:  'none',
          fontFamily:      "'DM Sans', sans-serif",
          fontSize:        '15px',
          fontWeight:      700,
          boxShadow:       '0 4px 18px rgba(45,106,79,0.22)',
          letterSpacing:   '0.01em',
          transition:      'background 0.15s',
        }}
      >
        {cta.label}
        <svg
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <line x1="7" y1="17" x2="17" y2="7" />
          <polyline points="7 7 17 7 17 17" />
        </svg>
      </a>

      {/* FTC disclosure — required adjacent to every monetized link */}
      <p style={{
        fontSize:    '11px',
        color:       '#9B9B9B',
        textAlign:   'center',
        margin:      '8px 0 0',
        lineHeight:  1.5,
        fontFamily:  "'DM Sans', sans-serif",
      }}>
        Decide may earn a commission. It never affects your recommendation.
        {cta.partnerId === 'amazon' && (
          <> Amazon and the Amazon logo are trademarks of Amazon.com, Inc.</>
        )}
      </p>
    </div>
  );
}
