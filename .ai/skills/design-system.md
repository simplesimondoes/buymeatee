# Skill: Design System

> **Status: implemented.** Tokens live in `app/globals.css` under `@theme` (Tailwind 4 CSS variables) — that file is the source of truth. No raw hex values in components.

## Brand colours (implemented tokens)

- `forest` `#073E2E` (primary deep green), `forest-dark` `#052D23`
- `cream` `#F6F1E7`, `offwhite` `#FCFAF6`, `stone` `#DED5C5`
- `gold` `#BD9C5D` (accents, progress fills, eyebrows on dark) — **lightened from the brief's `#B69755`** so small gold text on `forest` meets WCAG AA (4.64:1)
- `gold-deep` `#776027` — **added for contrast**: accessible gold-toned small text/links on cream/offwhite (plain `gold` on light backgrounds is decorative-only)
- `ink` `#15201B`, white `#FFFFFF`
- Muted body/meta text on light backgrounds uses `text-ink/70` as the floor — `/50–/60` opacities fail AA for small text; don't reintroduce them.

## Typography

- Editorial serif for major headings (via `next/font`), clean sans serif for body, controls and navigation.
- Clear scale: hero display → section headings → card headings → body → caption. Headings may use the serif even at small sizes for brand feel; UI controls stay sans.

## Spacing, radius, shadows

- Generous section rhythm — the brand is spacious and editorial. Consistent vertical padding scale between sections.
- Soft, generous radii on cards and buttons (the concept uses rounded cards and pill-ish buttons).
- Subtle shadows only; depth comes from colour blocking (deep green panels on cream) more than shadow.

## Core components (implemented — reuse before creating new ones)

In `components/`: `ButtonLink` (primary / secondary / onDark / onDarkOutline, pill), `Logo`/`LogoMark` (SVG tee mark + serif wordmark), `SectionHeading` (eyebrow + serif heading + intro, light/dark tone), `ExampleBadge` (Example/Preview/Concept labels), `ProgressBar` (gold fill, accessible), `GoalCard`, `CreatorPreviewCard`, `FaqAccordion` (native details/summary), `CallToAction`, `Breadcrumbs` (+ JSON-LD), `PageHeader`, `BlogCard`, `ArticleBody`, `EarlyAccessForm`, `Header`/`MobileNav`/`Footer`, `StructuredData`. Homepage sections in `components/home/`.

Dark panels set the `on-dark` class so focus outlines switch to gold (see `globals.css`).

## Responsive rules

Design intentionally at 375 / 768 / 1024 / 1440px. Side-by-side panels stack with preserved hierarchy; hero art crops gracefully; touch targets ≥ 44px.

## Logo and imagery

See [.ai/context/brand.md](../context/brand.md) for logo guidance. Imagery: authentic, warm, golden-hour golf photography; image references centralised; always `next/image` with real dimensions and descriptive alt text.

## Contrast

Cream-on-green and gold-on-green pairings must be checked against WCAG AA. Gold `#B69755` on cream is decorative-only unless verified.
