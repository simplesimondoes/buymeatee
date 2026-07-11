# Skill: Design System

> **Status: planned.** Tokens below are the approved starting direction from the brand brief; the implemented tokens in code become the source of truth once Wave 1 lands. Update this file with real token locations and component inventory then.

## Brand colours (starting tokens)

- `forest` `#073E2E` (primary deep green), `forest-dark` `#052D23`
- `cream` `#F6F1E7`, `offwhite` `#FCFAF6`, `stone` `#DED5C5`
- `gold` `#B69755` (accents, progress), `ink` `#15201B`, white `#FFFFFF`

Define as Tailwind theme tokens / CSS variables in one place. No raw hex values in components. Adjust values where contrast requires — record adjustments here.

## Typography

- Editorial serif for major headings (via `next/font`), clean sans serif for body, controls and navigation.
- Clear scale: hero display → section headings → card headings → body → caption. Headings may use the serif even at small sizes for brand feel; UI controls stay sans.

## Spacing, radius, shadows

- Generous section rhythm — the brand is spacious and editorial. Consistent vertical padding scale between sections.
- Soft, generous radii on cards and buttons (the concept uses rounded cards and pill-ish buttons).
- Subtle shadows only; depth comes from colour blocking (deep green panels on cream) more than shadow.

## Core components (planned)

Buttons (primary deep-green, secondary outline/cream, on-dark variants), cards (creator preview, goal card, support option), progress bars (gold fill on neutral track, with accessible text values), section headings (eyebrow + serif heading + intro), FAQ accordion, audience panels.

## Responsive rules

Design intentionally at 375 / 768 / 1024 / 1440px. Side-by-side panels stack with preserved hierarchy; hero art crops gracefully; touch targets ≥ 44px.

## Logo and imagery

See [.ai/context/brand.md](../context/brand.md) for logo guidance. Imagery: authentic, warm, golden-hour golf photography; image references centralised; always `next/image` with real dimensions and descriptive alt text.

## Contrast

Cream-on-green and gold-on-green pairings must be checked against WCAG AA. Gold `#B69755` on cream is decorative-only unless verified.
