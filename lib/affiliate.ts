/**
 * affiliate.ts — Config-driven affiliate/lead-gen resolution
 *
 * To add a new partner: extend PARTNERS with a new Vertical key.
 * No other file needs to change.
 *
 * Resolution priority for verticals:
 *   1. Template ID (most reliable — user explicitly chose a category)
 *   2. Claude's classification from generate-matrix (contextual, accurate)
 *   3. Keyword matching on decision text (last resort)
 */

export type Vertical =
  | 'product'      // laptops, electronics, general consumer goods → Amazon
  | 'auto'         // cars, trucks, vehicles
  | 'insurance'    // auto, home, life, Medicare
  | 'credit_card'  // credit cards, rewards cards
  | 'loan'         // personal/student loans, refinancing
  | 'mortgage'     // home loans, mortgage refinancing
  | 'mattress'     // mattresses, sleep products
  | 'unknown';

export type AffiliateCTA = {
  vertical:   Vertical;
  partnerId:  string;    // e.g. 'amazon'
  label:      string;    // button text
  href:       string;    // fully-built outbound URL incl. tag + subId context
  subId:      string;    // decision ID for attribution
  winnerName: string;    // the option that won — for analytics
};

// ── Partner registry ──────────────────────────────────────────────────────────
// One entry per monetizable vertical. Adding Phase 2 partners = one new key here.

type PartnerConfig = {
  partnerId: string;
  label: string;
  buildUrl: (winnerName: string, subId: string) => string;
};

const PARTNERS: Partial<Record<Vertical, PartnerConfig>> = {
  product: {
    partnerId: 'amazon',
    label: 'Check price on Amazon',
    buildUrl: (winnerName, subId) => {
      const tag = process.env.NEXT_PUBLIC_AMAZON_ASSOC_TAG ?? 'askhoot-20';
      return `https://www.amazon.com/s?k=${encodeURIComponent(winnerName)}&tag=${tag}&ascsubtag=${encodeURIComponent(subId)}`;
    },
  },

  // Phase 2 — uncomment and fill in when approved:
  // auto: {
  //   partnerId: 'truecar',
  //   label: 'See dealer prices on TrueCar',
  //   buildUrl: (winnerName, subId) => `https://www.truecar.com/...`,
  // },
  // credit_card: {
  //   partnerId: 'cj_cards',
  //   label: 'Compare card offers',
  //   buildUrl: (winnerName, subId) => `https://...`,
  // },
};

// ── Template → vertical map ────────────────────────────────────────────────────
// Template IDs are defined in lib/templates.ts. Add new entries as templates grow.

const TEMPLATE_VERTICALS: Partial<Record<string, Vertical>> = {
  laptop: 'product',
  car:    'auto',
  // home, job, city → 'unknown' (no affiliate partner in v1)
};

// ── Keyword fallback ───────────────────────────────────────────────────────────
// Only used when template and Claude classification both return 'unknown'.
// Keep patterns conservative to avoid false positives.

function keywordVertical(text: string): Vertical {
  const t = text.toLowerCase();

  // ── Financial verticals first (narrow, avoid false positives) ────────────────
  if (/\bcar\b|\bsuv\b|\btruck\b|vehicle|automobile|\bauto\b/.test(t)) return 'auto';
  if (/\binsurance\b/.test(t)) return 'insurance';
  if (/credit card|rewards card/.test(t)) return 'credit_card';
  if (/\bmortgage\b/.test(t)) return 'mortgage';
  if (/\bloan\b|refinanc|\bborrow\b/.test(t)) return 'loan';
  if (/mattress|\bsleep system\b/.test(t)) return 'mattress';

  // ── Consumer products (broad) ────────────────────────────────────────────────
  // Electronics
  if (/laptop|computer|headphone|earbuds|bluetooth|speaker|\btv\b|television|\bphone\b|smartphone|camera|tablet|gadget|electronics|keyboard|\bmouse\b|monitor|printer|router|smartwatch|\bwatch\b|webcam|headset/.test(t)) return 'product';
  // Furniture & home office
  if (/standing desk|\bdesk\b|\bchair\b|sofa|\bcouch\b|bookcase|bookshelf|\bshelf\b|shelving|dresser|\bdrawer\b|nightstand|furniture/.test(t)) return 'product';
  // Footwear & apparel
  if (/\bshoe\b|\bshoes\b|sneaker|running shoe|boot\b|sandal|\bclothing\b|apparel|\bjacket\b|\bcoat\b|\bshirt\b|\bpants\b|\bjeans\b|outfit/.test(t)) return 'product';
  // Household & cleaning
  if (/toilet paper|paper towel|detergent|laundry|vacuum|\bmop\b|\bbroom\b|cleaning supply|trash bag|dish soap/.test(t)) return 'product';
  // Kitchen & appliances
  if (/blender|coffee maker|coffee machine|air fryer|microwave|toaster|instant pot|stand mixer|food processor|dishwasher|refrigerator|\bfridge\b|oven/.test(t)) return 'product';
  // Fitness & outdoors
  if (/treadmill|\bbike\b|bicycle|helmet|dumbbell|\bweights\b|yoga mat|fitness|supplement|protein powder|tent|sleeping bag|backpack|luggage|\bbag\b/.test(t)) return 'product';
  // Health & personal care
  if (/toothbrush|electric toothbrush|\brazor\b|shampoo|skincare|sunscreen|vitamin|supplement/.test(t)) return 'product';
  // General purchase signals — catches remaining consumer decisions by intent language
  if (/\bbuy\b|\bpurchase\b|best \w+ for|which \w+ to (buy|get|choose)|choosing between/.test(t)) return 'product';

  return 'unknown';
}

// ── Public API ────────────────────────────────────────────────────────────────

const VALID_VERTICALS: Vertical[] = [
  'product', 'auto', 'insurance', 'credit_card', 'loan', 'mortgage', 'mattress',
];

/**
 * Resolve the decision vertical from three signals, in priority order:
 *   1. templateId — explicit category selection
 *   2. aiVertical — Claude's classification from generate-matrix
 *   3. keyword match on decisionText
 */
export function resolveVertical(
  templateId:   string | null,
  decisionText: string,
  aiVertical:   string | null = null,
): Vertical {
  // 1. Template wins — most reliable signal
  if (templateId && templateId in TEMPLATE_VERTICALS) {
    const v = TEMPLATE_VERTICALS[templateId];
    if (v && v !== 'unknown') return v;
  }

  // 2. Claude's classification — contextually accurate
  if (aiVertical && VALID_VERTICALS.includes(aiVertical as Vertical)) {
    return aiVertical as Vertical;
  }

  // 3. Keyword fallback
  return keywordVertical(decisionText);
}

/**
 * Build the affiliate CTA for a completed decision.
 * Returns null if no partner is configured for the resolved vertical.
 */
export function resolveAffiliate(args: {
  templateId:   string | null;
  decisionText: string;
  winnerName:   string;
  subId:        string;
  aiVertical?:  string | null;
}): AffiliateCTA | null {
  if (!args.winnerName.trim()) return null;

  const vertical = resolveVertical(args.templateId, args.decisionText, args.aiVertical ?? null);
  const partner  = PARTNERS[vertical];

  if (!partner) return null; // No partner configured for this vertical yet

  return {
    vertical,
    partnerId:  partner.partnerId,
    label:      partner.label,
    href:       partner.buildUrl(args.winnerName, args.subId),
    subId:      args.subId,
    winnerName: args.winnerName,
  };
}
