# Image requirements

Central reference for every image slot on the marketing site. Image metadata
(paths, dimensions, alt text) lives in code at [`lib/content/images.ts`](../../lib/content/images.ts) —
that file is the source of truth; keep the two in sync.

## ⚠️ Current status: mostly low-resolution placeholders

Most files in `public/images/` were extracted from the founder's concept
contact sheet (`files/homepage_images.png`) at roughly **300 × 170 px**. They
establish the art direction but are **below production quality** — each slot
must be replaced with a high-resolution original (same subject or equivalent)
before launch. Replacement is drop-in: keep the filename, update the
`width`/`height` in `lib/content/images.ts`.

Exceptions (production quality, supplied Jul 2026):

- `hero-journey.png` (1881 × 836) — the homepage full-bleed hero.
- `app-concept-creator-profile.png` / `app-concept-supporter-collection.png`
  — phone screens cropped from the approved app mockups
  (`screenshots/appui.png`), used as `Concept`-labelled imagery. Higher-res
  exports of the same screens would still be an upgrade (~2× display size).

## Licensing

All launch imagery must be licensed, original or verified royalty-free.
Do not copy images from other golf sites. **Avoid frames showing third-party
equipment logos** — contact-sheet frames 04 (Titleist visor), 09 (Titleist
clubs), 18 (PING cap) are deliberately unused; check replacements for the
same problem.

## Slots

| Slot | File | Display size (max) | Recommended source | Aspect | Subject / alt direction |
| --- | --- | --- | --- | --- | --- |
| Homepage hero (full-bleed) | `hero-journey` | 100vw (up to ~1920 px) | ≥ 1900 px wide ✅ supplied | ~2.25:1 | Golfers walking a coastal course at golden hour — subjects right of centre so left copy stays clear |
| Tip-jar section phone | `app-concept-creator-profile` | ~300 px wide | 2× export of mockup screen | ~9:17 | Concept creator profile screen — always labelled `Concept` |
| Supporter panel phone | `app-concept-supporter-collection` | ~280 px wide | 2× export of mockup screen | ~7:10 | Concept supporter collection screen — always labelled `Concept` |
| Creator example card (Alex Morgan) | `05_golfer_driver_swing` | ~384 px wide | ≥ 800 px wide | ~3:2 | Relatable golfer mid-swing |
| Creator audience panel (`/for-creators`) | `23_creator_vlogging_golf` | ~640 px wide | ≥ 1300 px wide | ~2:1 | Creator filming on-course — authentic, not staged-corporate |
| Supporter panel (`/for-supporters`) | `13_golfers_fist_bump` | ~640 px wide | ≥ 1300 px wide | ~3:2 | Two golfers celebrating — connection, community |
| Goal: Scotland Links Trip | `07_links_course_aerial` | ~360 px wide | ≥ 800 px wide | ~16:9 | Coastal links aerial |
| Goal: Road to Scratch | `03_woman_reading_putt` | ~360 px wide | ≥ 800 px wide | ~16:9 | Golfer reading a putt — focus, practice |
| Goal: Amateur Championship Entry | `21_tournament_competition` | ~360 px wide | ≥ 800 px wide | ~16:9 | Competitive tournament tee shot |
| Goal: Independent Course Reviews | `20_coastal_cliff_golf_hole` | ~360 px wide | ≥ 800 px wide | ~16:9 | Dramatic course scenery |
| Goal: First Professional Season | `15_bunker_shot_action` | ~360 px wide | ≥ 800 px wide | ~16:9 | Action shot, effort and skill |
| Goal: Women's Golf Content Series | `12_woman_full_swing` | ~360 px wide | ≥ 800 px wide | ~16:9 | Woman golfer full swing |
| How-it-works page | `06_friends_walking_fairway` | ~640 px wide | ≥ 1300 px wide | ~2:1 | Friends walking the fairway together |
| About page | `11_flag_at_sunset` | ~672 px wide | ≥ 1400 px wide | ~16:9 | Pin flag at sunset — quiet, evocative |
| Blog: support a creator | `23_creator_vlogging_golf` | ~672 px wide | ≥ 1400 px wide | ~2:1 | (shared with creator panel) |
| Blog: fund content | `22_travel_golf_trip` | ~672 px wide | ≥ 1400 px wide | ~2:1 | Golfer travelling with clubs |
| Blog: amateur sponsorship | `21_tournament_competition` | ~672 px wide | ≥ 1400 px wide | ~2:1 | (shared with goal card) |
| Blog: cost of golf content | `10_golf_ball_closeup` | ~672 px wide | ≥ 1400 px wide | ~2:1 | Ball in grass close-up |
| Social sharing default | *generated* (`app/opengraph-image.tsx`) | 1200 × 630 | — | 1.91:1 | Branded card from design tokens — no photo needed |
| Favicon / app icon | *generated* (`app/icon.svg`, `app/apple-icon.tsx`) | — | — | 1:1 | Tee-and-ball brand mark |

Unused-but-extracted frames (01, 02, 08, 14, 16, 17, 19, 24, 25) remain in
`public/images/` as options for future sections; the same replacement and
licensing rules apply if they are put into use. Frame 24 (junior golfer)
must only ever appear in a context that reflects the parent/guardian rule.

## Alt text rules

Every image has descriptive alt text in `lib/content/images.ts` — describe
the scene, not the filename; no keyword stuffing. Decorative icons are
`aria-hidden`.
