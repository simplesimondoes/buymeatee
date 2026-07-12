# Skill: Design System

> **Status: implemented.** Tokens live in `app/globals.css` under `@theme` (Tailwind 4 CSS variables) — that file is the source of truth. No raw hex values in components.

## Brand colours (implemented tokens)

> **Jul 2026 redesign:** the original cream/offwhite/stone warm palette was replaced with a modern-white scheme to match the approved app mockups. `cream` and `offwhite` no longer exist as tokens — use `white` and `mist`.

- `forest` `#073E2E` (primary deep green), `forest-dark` `#052D23`
- `white` `#FFFFFF` (base background), `mist` `#F6F6F3` (alternate section background), `stone` `#E7E6E1` (light neutral borders)
- `gold` `#BD9C5D` (accents, progress fills, eyebrows on dark) — **lightened from the brief's `#B69755`** so small gold text on `forest` meets WCAG AA (4.64:1)
- `gold-deep` `#776027` — **added for contrast**: accessible gold-toned small text/links on white/mist (plain `gold` on light backgrounds is decorative-only)
- `ink` `#15201B`
- Text on dark green panels is `white` (with `/85`–`/75` opacities for secondary copy).
- Muted body/meta text on light backgrounds uses `text-ink/70` as the floor — `/50–/60` opacities fail AA for small text; don't reintroduce them.

## Typography

- Editorial serif for major headings (via `next/font`), clean sans serif for body, controls and navigation.
- Clear scale: hero display → section headings → card headings → body → caption. Headings may use the serif even at small sizes for brand feel; UI controls stay sans.

## Spacing, radius, shadows

- Generous section rhythm — the brand is spacious and editorial. Sections alternate `white` / `mist`, punctuated by deep-green (`forest`/`forest-dark`) blocks.
- Soft, generous radii on cards and buttons (the concept uses rounded cards and pill-ish buttons).
- Subtle shadows only; depth comes from colour blocking (deep green panels on white) more than shadow.

## Core components (implemented — reuse before creating new ones)

In `components/`: `ButtonLink` (primary / secondary / onDark / onDarkOutline, pill), `Logo`/`Wordmark` (**text-only serif italic wordmark** — the tee glyph was dropped from the site logo Jul 2026; the compact tee mark survives only in favicons/app icons), `SectionHeading` (eyebrow + serif heading + intro, light/dark tone), `ExampleBadge` (Example/Preview/Concept labels), `ProgressBar` (gold fill, accessible), `GoalCard`, `CreatorPreviewCard`, `FaqAccordion` (native details/summary), `CallToAction`, `Breadcrumbs` (+ JSON-LD), `PageHeader`, `BlogCard`, `ArticleBody`, `EarlyAccessForm`, `Header`/`MobileNav`/`Footer`, `StructuredData`. Homepage sections in `components/home/`.

Dark panels set the `on-dark` class so focus outlines switch to gold (see `globals.css`).

## Responsive rules

Design intentionally at 375 / 768 / 1024 / 1440px. Side-by-side panels stack with preserved hierarchy; hero art crops gracefully; touch targets ≥ 44px.

The homepage hero is a full-bleed image from `sm` upwards with a left-to-right white gradient for copy legibility; below `sm` the copy stacks above a full-width image strip (`components/home/hero.tsx`).

## Logo and imagery

See [.ai/context/brand.md](../context/brand.md) for logo guidance. Imagery: authentic, warm, golden-hour golf photography; image references centralised; always `next/image` with real dimensions and descriptive alt text.

App concept screens (cropped from `screenshots/appui.png`) may be used as imagery when framed as a phone and labelled `Concept` (ADR-007) — see `lib/content/images.ts` `appConcept*` entries.

## Contrast

White-on-green and gold-on-green pairings must be checked against WCAG AA. Gold on light backgrounds is decorative-only unless verified — use `gold-deep` for small text.
