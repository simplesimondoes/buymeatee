# Brand context

## Name

Exact spelling, always: **BuyMeATee**. Domain: `buymeatee.com`.

Never: BuyMeaTee, Buy Me A Tee, BuyMea Tee, or inconsistent casing. Note: the approved design concept image renders the wordmark as "BuyMeaTee" — the concept's *style* is approved, the spelling is not; always use BuyMeATee.

## Proposition

> **Jul 2026 (founder repositioning, ADR-021):** the brand leads with the golfer's ambition, not the payment. BuyMeATee is the platform where golfers fund their ambitions — never a tipping platform.

Primary line: **For Golfers With a Goal.**

Primary explanation: *Every golfer has a goal. BuyMeATee helps them achieve it.*

Supporter-facing line (used where the audience is supporters, e.g. share texts, profile/OG copy, emails): *Support the journey.*

Supporting line: *Follow the journey. Support a goal. Buy them a tee.*

## Tone

Warm, aspirational, golf-literate, premium but approachable, community-oriented, honest, **British English**. Never charity-like, never desperate, never overly corporate.

## Palette

> **Jul 2026 (founder decision):** the original warm cream/stone palette from the brief was replaced with a **modern white** scheme to match the approved app mockups — white base, very light neutral (`mist`) alternate sections, deep green and gold unchanged.

| Token | Value |
| --- | --- |
| Deep forest green | `#073E2E` |
| Dark forest | `#052D23` |
| White (base) | `#FFFFFF` |
| Mist (alternate sections) | `#F6F6F3` |
| Stone (light neutral borders) | `#E7E6E1` |
| Muted gold | `#B69755` (implemented as `#BD9C5D`/`#776027` for contrast) |
| Ink | `#15201B` |

Adjust where needed for contrast and cohesion. The design tokens in code are the source of truth — see [.ai/skills/design-system.md](../skills/design-system.md).

## Typography direction

- Refined editorial serif for major headings.
- Clean readable sans serif for body copy, controls and navigation.
- The overall feel: premium golf publication / elegant members' club / modern creator platform. Editorial, warm, spacious, image-led — not B2B SaaS.

## Approved CTA language

- Create your page (primary since the Jul 2026 repositioning)
- Start your page
- Explore golfers
- Join early access
- Find golf creators
- Join as a supporter
- See how it works
- Support a goal / Buy a tee / Support a round

## Disallowed claims and language

- Donate now / beg for support / crowdfunding platform / give us money / influencer-only language.
- No fake reviews, ratings, user counts, supporter avatars, partner logos, press logos or transaction totals. **The approved concept image contains these ("4.9/5 from 1,200+ reviews", "+2.5K" avatars) — do not reproduce them.**
- Payment claims must match reality. Since Jul 2026 payments are live (Stripe Connect, ADR-009) and may be described plainly ("Payments secured by Stripe", real fee percentages from `getFeeConfig()`); never invent fees, payout times or guarantees beyond what is implemented.
- Fictional creators, goals and previews must be labelled `Example`, `Preview` or `Concept`.

## Logo guidance

**Jul 2026 (founder decision):** the site logo is the **text-only serif-italic wordmark** (`components/logo.tsx`) matching the app mockups — no tee glyph next to the text. The compact tee-and-ball mark survives only as the favicon/app icon (`app/icon.svg`, `app/apple-icon.tsx`). Deep-green primary version; white reversed version; programmatic implementation; accessible text treatment. Do not imitate a protected golf logo.

## Reference concepts

- `screenshots/Mockup.png` — approved marketing-page concept (primary visual reference; replaced the earlier `image.png` in Jul 2026).
- `screenshots/appui.png` — mobile-app concepts (supporting product inspiration: creator page, support options, goals, activity, supporters, collections/badges, creator dashboard). Phone screens cropped from this sheet are used on the homepage as `Concept`-labelled imagery.
- `files/homepage_images.png` — contact sheet of 25 named homepage imagery slots (`01_hero_sunset_links_golfer` … `25_aerial_golf_hole`): golden-hour links golf, diverse golfers, course/clubhouse scenery, creator vlogging, junior golfer. Caution: a few frames show visible equipment logos (PING, Titleist) — avoid or verify licensing before using frames with third-party marks.
- `files/buymeatee-marketing-site-prompt.md` — the full founder brief for the marketing site.
