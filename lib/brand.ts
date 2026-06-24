/**
 * brand.ts — single source of truth for app name, colors, and tagline.
 *
 * To rebrand: change BRAND.name here. Every header, page title, OG tag,
 * and share card that imports this file updates automatically.
 */

export const BRAND = {
  /** Display name — shown in headers, share cards, OG titles */
  name: 'decide',

  /** One-line tagline used in OG descriptions and the landing hero */
  tagline: 'Make great decisions',

  /** Used in <meta name="description"> */
  description: 'A weighted decision matrix powered by AI',

  /** Primary green — buttons, logo text, accents */
  primary: '#2D6A4F',

  /** Secondary green — hover states, progress bar fill */
  secondary: '#52B788',

  /** Warm accent — templates, highlights */
  accent: '#E9C46A',

  /** Background — warm off-white used site-wide */
  bg: '#F9F7F4',
} as const;
