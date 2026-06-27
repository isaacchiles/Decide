---
name: AskHoot
description: >
  AI-powered weighted decision matrix tool. Warm, calm, intelligent. The visual
  identity pairs a serif display face (Fraunces) with a humanist sans-serif
  (DM Sans) against a warm cream canvas — grounded by forest green as the
  single primary action color.

colors:
  # --- Brand greens ---
  primary: "#2D6A4F"          # Forest Green — logo, CTAs, primary actions, accent numbers
  secondary: "#52B788"        # Leaf Green — highlights, progress fills, winner accent
  deep: "#1A3C2A"             # Deep Forest — dark surfaces (share card bg)
  primary-surface: "#E8F5EE"  # Mint Surface — selected states, badges, loading icons
  primary-border: "#A8D5BE"   # Sage Border — borders on green-tinted elements
  primary-border-alt: "#B7DFC9" # Sage Border Alt — add-constraint button borders

  # --- Neutral canvas ---
  background: "#F9F7F4"       # Warm Cream — main page background, nav, all screens
  background-alt: "#F2EFE9"   # Warm Cream Alt — loading screen, progress bar track, weight bar track
  surface: "#FFFFFF"          # White — cards, input fields, nav bar
  border: "#E0DBD3"           # Warm Border — default borders, dividers, table lines
  border-subtle: "#D5D0C8"    # Subtle Border — sheet handle, light dividers

  # --- Text ---
  text-primary: "#1A1A1A"     # Near Black — all body copy, headings, input text
  text-secondary: "#6B6B6B"   # Medium Gray — labels, metadata, captions, helper text
  text-tertiary: "#9B9B9B"    # Light Gray — hint text, timestamps, ghost states

  # --- Amber (preferences / winner accent) ---
  amber: "#E9C46A"            # Amber Gold — preference badges, winner card accent strip
  amber-dark: "#8B6914"       # Amber Dark — text on amber backgrounds
  amber-surface: "#FEF8E8"    # Amber Surface — preference tag backgrounds
  amber-border: "#F0D98A"     # Amber Border — preference tag borders

  # --- Semantic ---
  error: "#DC2626"            # Error Red — error icons, strokes
  error-dark: "#C1121F"       # Error Dark — error body text
  error-surface: "#FEE2E2"    # Error Surface — error icon container background
  error-surface-light: "#FDEAEA" # Error Light — delete / destructive row backgrounds
  error-border: "#F5A0A0"     # Error Border — delete / destructive row borders

typography:
  # Display — Fraunces (variable serif, Google Fonts)
  # Used for: wordmark, H1/H2/H3 headings, scores, numeric callouts
  wordmark:
    fontFamily: Fraunces
    fontSize: 1.25rem      # 20px in blog header; 17px in app nav
    fontWeight: 800
    letterSpacing: -0.02em
    color: "{colors.primary}"

  h1-app:
    fontFamily: Fraunces
    fontSize: 2.375rem     # 38px
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: -0.02em
    color: "{colors.text-primary}"

  h2-app:
    fontFamily: Fraunces
    fontSize: 1.875rem     # 30px
    fontWeight: 800
    lineHeight: 1.15
    color: "{colors.text-primary}"

  h3-app:
    fontFamily: Fraunces
    fontSize: 1.1875rem    # 19px
    fontWeight: 700
    color: "{colors.text-primary}"

  score-display:
    fontFamily: Fraunces
    fontSize: 2.25rem      # 36px
    fontWeight: 800
    lineHeight: 1
    color: "{colors.primary}"

  h1-blog:
    fontFamily: Fraunces
    fontSize: 2.25rem      # 36px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.02em
    color: "{colors.text-primary}"

  h2-blog:
    fontFamily: Fraunces
    fontSize: 1.5rem       # 24px
    fontWeight: 700
    letterSpacing: -0.01em
    color: "{colors.text-primary}"

  # Body — DM Sans (variable sans-serif, Google Fonts)
  # Used for: all body copy, UI labels, buttons, inputs, captions
  body-lg:
    fontFamily: DM Sans
    fontSize: 0.9375rem    # 15px
    lineHeight: 1.65
    color: "{colors.text-primary}"

  body-md:
    fontFamily: DM Sans
    fontSize: 0.875rem     # 14px
    lineHeight: 1.65
    color: "{colors.text-primary}"

  body-blog:
    fontFamily: DM Sans
    fontSize: 1.0625rem    # 17px
    lineHeight: 1.75
    color: "{colors.text-primary}"

  label-caps:
    fontFamily: DM Sans
    fontSize: 0.6875rem    # 11px
    fontWeight: 700
    letterSpacing: 0.07em
    textTransform: uppercase
    color: "{colors.text-secondary}"

  caption:
    fontFamily: DM Sans
    fontSize: 0.75rem      # 12px
    color: "{colors.text-secondary}"

  button:
    fontFamily: DM Sans
    fontSize: 1rem         # 16px for large; 0.875rem for small
    fontWeight: 700
    letterSpacing: 0.01em

rounded:
  xs: 4px       # Progress bar fill, tiny accents
  sm: 8px       # Input fields, small add-buttons, table containers
  md: 10px      # Option list items, ranked result rows
  lg: 12px      # Standard cards, criteria panels, result panels
  xl: 16px      # Blog CTA card, share link preview
  pill: 20px    # Pill badges, template chips, tag chips
  full: 24px    # Primary CTA buttons, bottom sheet, large pills
  circle: 50%   # Icon containers, dot indicators, avatar circles

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 44px
  3xl: 52px

components:
  # Primary CTA — forest green pill, used for all main actions
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    typography: "{typography.button}"
    rounded: "{rounded.full}"
    padding: 16px 44px
    shadow: 0 4px 20px rgba(45,106,79,0.28)

  # Secondary / ghost — white with warm border
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    padding: 14px 24px
    border: 1.5px solid {colors.border}

  # Inline add button — compact, square-ish
  button-add:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.sm}"
    padding: 10px 18px

  # Standard card — white, subtle shadow, warm border
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    border: 1px solid {colors.border}
    shadow: 0 2px 8px rgba(0,0,0,0.06)

  # Winner card — green-bordered, glowing
  card-winner:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    border: 2px solid {colors.secondary}
    shadow: 0 8px 36px rgba(82,183,136,0.16)

  # Text input
  input-text:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.sm}"
    border: 1.5px solid {colors.border}
    padding: 10px 14px

  # Primary badge — green, all-caps, used for "Winner", option sources
  badge-primary:
    backgroundColor: "{colors.primary-surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    padding: 3px 9px

  # Constraint tag — green-tinted pill
  badge-constraint:
    backgroundColor: "{colors.primary-surface}"
    textColor: "{colors.primary}"
    rounded: "{rounded.pill}"
    border: 1px solid {colors.primary-border}
    padding: 6px 8px 6px 14px

  # Preference tag — amber-tinted pill
  badge-preference:
    backgroundColor: "{colors.amber-surface}"
    textColor: "{colors.amber-dark}"
    rounded: "{rounded.pill}"
    border: 1px solid {colors.amber-border}
    padding: 6px 8px 6px 14px

  # Sticky top nav
  nav-header:
    backgroundColor: "{colors.surface}"
    border: 1px solid {colors.border}

  # Progress / weight bar
  progress-track:
    backgroundColor: "{colors.background-alt}"
    rounded: "{rounded.xs}"
    height: 7px

  progress-fill:
    backgroundColor: "{colors.secondary}"
    rounded: "{rounded.xs}"
---

## Overview

AskHoot is a calm, confident guide — not a flashy tool. The visual language should feel like a premium notebook: warm off-white paper, deep forest ink, and a single amber accent for moments of celebration. Every screen's job is to reduce cognitive load, not add to it.

The two fonts do two distinct jobs and must never be swapped. Fraunces carries authority: headlines, the wordmark, numeric scores, and the key result callouts. DM Sans handles everything operational: body copy, labels, buttons, inputs, helper text. The contrast between the two is intentional and load-bearing — Fraunces commands attention, DM Sans disappears into utility.

The green is the only primary action color. There is no blue, no purple, no teal. If you find yourself reaching for another hue on a button or link, stop and use `#2D6A4F`. The amber (`#E9C46A`) appears only for preferences and the winner card accent strip — it signals celebration and secondary information, never primary action.

## Colors

The palette has four functional groups:

**Brand greens** are the identity. `#2D6A4F` (Forest Green) is the primary — used on every CTA button, the wordmark, active links, and numeric callouts. `#52B788` (Leaf Green) is the secondary highlight: progress fills, the winner card border, and the "Decision Complete" eyebrow. `#1A3C2A` (Deep Forest) appears only in the share card's dark background. Never use the secondary or deep greens for buttons or primary actions — they are accent and surface colors only.

**Neutral canvas** is warm, never cold. The background is `#F9F7F4` (Warm Cream), not white and not gray. Cards sit on white (`#FFFFFF`). The slightly darker `#F2EFE9` signals loading states and progress bar tracks. All borders are `#E0DBD3` — a warm greige, never a cool neutral like `#E5E7EB`.

**Text** runs from near-black (`#1A1A1A`) for primary copy, through medium gray (`#6B6B6B`) for labels and metadata, to light gray (`#9B9B9B`) for hints and ghost states. Do not use pure `#000000` anywhere.

**Semantic** colors (amber, error red) are used only for their specific roles. Amber on preferences and winner accents. Red on errors and destructive actions. Neither appears as decoration.

## Typography

Two fonts. Both loaded from Google Fonts. Both must be present in the `<link>` import:

```
https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,700;9..144,800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&display=swap
```

**Fraunces** (display serif) is used for: the AskHoot wordmark, all `<h1>` / `<h2>` / `<h3>` headings, weighted score numbers, the "Your Decision Matrix" title, and any large numeric callout. Always paired with weight 700 or 800. Always with `letterSpacing: -0.02em` at display sizes. Never use Fraunces for body copy, labels, or buttons.

**DM Sans** (humanist sans) is the default for everything else. The root `fontFamily` on `<body>` and any top-level container should be `'DM Sans', sans-serif`. Button text, input values, helper labels, captions, and all paragraph copy use DM Sans.

Label caps (`font-size: 11px; letter-spacing: 0.07em; text-transform: uppercase; font-weight: 700`) are a recurring pattern used for section headers like "CRITERIA", "OPTIONS", "CONSTRAINTS". Always DM Sans, always `#6B6B6B`.

## Layout & Spacing

The app is single-column mobile-first, max-width `480px` on the tool, `680–720px` on blog content. Content padding is consistently `24px` horizontal on mobile.

The sticky nav is `60px` tall (`height: 60px`), `background: white`, with `borderBottom: 1px solid #E0DBD3` and `zIndex: 100`. The progress bar beneath it is `3px` tall.

Card panels use `padding: 28px` internally. Use `gap: 16px` between stacked cards and `gap: 24px` between major sections.

## Elevation & Depth

Four shadow levels, used consistently:

- **Resting** (`0 1px 3px rgba(0,0,0,0.05)`): list items, ranked results
- **Card** (`0 2px 8px rgba(0,0,0,0.06)`): all standard white cards, the scoring table
- **Float** (`0 4px 20px rgba(45,106,79,0.28)`): primary CTA buttons — the green tint on this shadow is intentional, it reinforces the brand color
- **Winner glow** (`0 8px 36px rgba(82,183,136,0.16)`): the winner recommendation card only

Modal overlays use `background: rgba(0,0,0,0.55)`. The bottom sheet (share modal) uses `0 -8px 40px rgba(0,0,0,0.18)` upward shadow.

## Shapes

Border radii follow a deliberate scale — do not introduce new values. The key mapping:

- Inputs and small action buttons → `8px`
- Standard cards and panels → `12px`
- Large result cards, blog CTA → `16px`
- All pill tags and chips → `20px`
- Primary CTA buttons and the share sheet → `24px`
- Circles (dots, icon containers) → `50%`

The `24px` pill on primary buttons is a signature of the brand. Every screen's main call to action should use this shape.

## Components

**Primary button** is always `background: #2D6A4F`, `color: white`, `border-radius: 24px`, `font-weight: 700`, with the `rgba(45,106,79,0.28)` shadow. Full-width on mobile (`width: 100%`), auto-width with `padding: 16px 44px` in constrained contexts. Do not use any other background color for the primary action.

**Secondary button** mirrors the pill shape but is `background: white`, `border: 1.5px solid #E0DBD3`, `color: #1A1A1A`. Used for "Start Over", "Cancel", and non-primary flows.

**Add button** (inline, next to an input) is `background: #2D6A4F`, `border-radius: 8px`, `padding: 10px 18px` — same green, squarer shape, smaller.

**Input fields** use `border: 1.5px solid #E0DBD3`, `border-radius: 8px`, `background: white`, `font-family: DM Sans`. On focus, the border becomes `#2D6A4F`.

**Tags / pills**: Constraint tags are green-tinted (`#E8F5EE` background, `#A8D5BE` border, `#2D6A4F` text). Preference tags are amber-tinted (`#FEF8E8` background, `#F0D98A` border, `#8B6914` text). Both use `border-radius: 20px`. Source badges (e.g. "AI", "You") use the green badge: `#E8F5EE` background, `#2D6A4F` text, `font-size: 10px`, uppercase.

**Winner card accent strip**: `linear-gradient(90deg, #2D6A4F 0%, #52B788 60%, #E9C46A 100%)` at `height: 4px` across the top of the recommendation card.

**Progress / weight bars**: Track is `#F2EFE9`, fill is `#52B788`, height `7–8px`, radius `4px`.

**Blog prose** (`.prose` class): body `17px / 1.75`, links `#2D6A4F` underlined, blockquote left border `3px solid #52B788`, `code` background `#F0EDE8`, tables use `#F0EDE8` header background and `#E0DBD3` borders.

## Do's and Don'ts

**Do** use Fraunces for headings and DM Sans for everything else — never mix them in the same role.

**Do** use `#2D6A4F` for every primary action. One action color, everywhere.

**Do** keep backgrounds warm — `#F9F7F4` for pages, `#FFFFFF` for cards. Never use a cool gray as a background.

**Do** use `border-radius: 24px` on all primary CTA buttons without exception.

**Don't** introduce new colors. If a new semantic color seems necessary, audit whether an existing one fits first.

**Don't** use pure black (`#000000`) or pure white (`#FFFFFF`) as text colors. Use `#1A1A1A` and `#F9F7F4` respectively.

**Don't** use the amber color (`#E9C46A`) for primary actions, links, or headings. It belongs to preferences and celebration moments only.

**Don't** use `font-weight: 400` for Fraunces — it's a display face and looks weak at regular weight. Always 700 or 800.

**Don't** use `border-radius` values not in the scale above. No `6px`, no `14px`, no `32px`.
