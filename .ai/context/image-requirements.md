# Image requirements

Central reference for every image slot on the marketing site. Image metadata
(paths, dimensions, alt text) lives in code at [`lib/content/images.ts`](../../lib/content/images.ts) —
that file is the source of truth; keep the two in sync.

## ⚠️ Current status: low-resolution placeholders

Every file in `public/images/` was extracted from the founder's concept
contact sheet (`files/homepage_images.png`) at roughly **300 × 170 px**. They
establish the art direction but are **below production quality** — each slot
must be replaced with a high-resolution original (same subject or equivalent)
before launch. Replacement is drop-in: keep the filename, update the
`width`/`height` in `lib/content/images.ts`.

## Licensing

All launch imagery must be licensed, original or verified royalty-free.
Do not copy images from other golf sites. **Avoid frames showing third-party
equipment logos** — contact-sheet frames 04 (Titleist visor), 09 (Titleist
clubs), 18 (PING cap) are deliberately unused; check replacements for the
same problem.

## Slots

| Slot | File | Display size (max) | Recommended source | Aspect | Subject / alt direction |
| --- | --- | --- | --- | --- | --- |
| Homepage hero | `01_hero_sunset_links_golfer` | ~660 px wide (2× ~1320) | ≥ 2000 px wide | ~3:2 | Golfer finishing a drive, links course, golden hour — aspirational, warm |
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

Unused-but-extracted frames (02, 08, 14, 16, 17, 19, 24, 25) remain in
`public/images/` as options for future sections; the same replacement and
licensing rules apply if they are put into use. Frame 24 (junior golfer)
must only ever appear in a context that reflects the parent/guardian rule.

## Alt text rules

Every image has descriptive alt text in `lib/content/images.ts` — describe
the scene, not the filename; no keyword stuffing. Decorative icons are
`aria-hidden`.
