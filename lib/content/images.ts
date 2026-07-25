/**
 * Centralised image references.
 *
 * ⚠️ The current files in /public/images are LOW-RESOLUTION placeholders
 * extracted from the founder's concept contact sheet
 * (files/homepage_images.png). Every slot must be replaced with the
 * high-resolution original before launch — see
 * .ai/context/image-requirements.md for required sizes and licensing.
 *
 * Frames with visible third-party equipment logos (PING, Titleist) are
 * intentionally not referenced here.
 *
 * Localisation: `alt` holds the English source text and stays for existing
 * call sites; `altKey` points at the same string in the `content` message
 * namespace (`messages/<locale>/content.json` → `imageAlt.<id>`) so
 * locale-aware consumers render `t(image.altKey)` instead.
 */

export type SiteImage = {
  src: string;
  width: number;
  height: number;
  /** English source alt text (fallback for non-localised call sites). */
  alt: string;
  /** Key in the `content` message namespace: `imageAlt.<imageId>`. */
  altKey?: string;
};

export const images = {
  /** Full-bleed homepage hero — supplied at full resolution (not a placeholder). */
  heroJourney: {
    src: "/images/hero-journey.png",
    width: 1881,
    height: 836,
    alt: "Three golfers carrying their bags along a coastal course at sunset",
    altKey: "imageAlt.heroJourney",
  },
  /** App concept screens cropped from the approved UI mockups (screenshots/appui.png). Always label Concept. */
  appConceptCreatorProfile: {
    src: "/images/app-concept-creator-profile.png",
    width: 282,
    height: 538,
    alt: "Concept app screen of a fictional creator profile with a current goal and progress bar",
    altKey: "imageAlt.appConceptCreatorProfile",
  },
  appConceptSupporterCollection: {
    src: "/images/app-concept-supporter-collection.png",
    width: 316,
    height: 448,
    alt: "Concept app screen of a fictional supporter profile with collected courses and badges",
    altKey: "imageAlt.appConceptSupporterCollection",
  },
  heroLinksGolfer: {
    src: "/images/01_hero_sunset_links_golfer.png",
    width: 330,
    height: 200,
    alt: "Golfer finishing a drive on a links course above the sea at sunset",
    altKey: "imageAlt.heroLinksGolfer",
  },
  groupDiverseGolfers: {
    src: "/images/02_group_diverse_golfers.png",
    width: 356,
    height: 200,
    alt: "Four golfers chatting together beside their bags on the course",
    altKey: "imageAlt.groupDiverseGolfers",
  },
  womanReadingPutt: {
    src: "/images/03_woman_reading_putt.png",
    width: 240,
    height: 200,
    alt: "Golfer crouching on the green to read the line of a putt",
    altKey: "imageAlt.womanReadingPutt",
  },
  golferDriverSwing: {
    src: "/images/05_golfer_driver_swing.png",
    width: 306,
    height: 200,
    alt: "Golfer mid-swing with a driver against a bright sky",
    altKey: "imageAlt.golferDriverSwing",
  },
  friendsWalkingFairway: {
    src: "/images/06_friends_walking_fairway.png",
    width: 330,
    height: 174,
    alt: "Three friends carrying their bags down the fairway at golden hour",
    altKey: "imageAlt.friendsWalkingFairway",
  },
  linksCourseAerial: {
    src: "/images/07_links_course_aerial.png",
    width: 308,
    height: 174,
    alt: "Aerial view of a coastal links course winding along the shoreline",
    altKey: "imageAlt.linksCourseAerial",
  },
  clubhouseEvening: {
    src: "/images/08_clubhouse_evening.png",
    width: 295,
    height: 174,
    alt: "Stone clubhouse glowing with warm light in the evening",
    altKey: "imageAlt.clubhouseEvening",
  },
  golfBallCloseup: {
    src: "/images/10_golf_ball_closeup.png",
    width: 306,
    height: 174,
    alt: "Close-up of a golf ball sitting in dew-covered grass",
    altKey: "imageAlt.golfBallCloseup",
  },
  flagAtSunset: {
    src: "/images/11_flag_at_sunset.png",
    width: 320,
    height: 178,
    alt: "Pin flag silhouetted against a golden sunset sky",
    altKey: "imageAlt.flagAtSunset",
  },
  womanFullSwing: {
    src: "/images/12_woman_full_swing.png",
    width: 278,
    height: 178,
    alt: "Golfer completing a full swing on the course",
    altKey: "imageAlt.womanFullSwing",
  },
  golfersFistBump: {
    src: "/images/13_golfers_fist_bump.png",
    width: 279,
    height: 178,
    alt: "Two golfers sharing a fist bump on the course by the sea",
    altKey: "imageAlt.golfersFistBump",
  },
  mountainCourseView: {
    src: "/images/14_mountain_course_view.png",
    width: 279,
    height: 178,
    alt: "Golf course set in a green mountain valley beside a lake",
    altKey: "imageAlt.mountainCourseView",
  },
  bunkerShotAction: {
    src: "/images/15_bunker_shot_action.png",
    width: 348,
    height: 178,
    alt: "Golfer splashing sand while playing out of a bunker",
    altKey: "imageAlt.bunkerShotAction",
  },
  womanSunriseView: {
    src: "/images/16_woman_sunrise_view.png",
    width: 294,
    height: 156,
    alt: "Golfer looking out over the course at sunrise",
    altKey: "imageAlt.womanSunriseView",
  },
  putterAndBall: {
    src: "/images/17_putter_and_ball_closeup.png",
    width: 285,
    height: 156,
    alt: "Putter and ball beside the hole on a practice green",
    altKey: "imageAlt.putterAndBall",
  },
  friendsGolfCart: {
    src: "/images/19_friends_golf_cart.png",
    width: 295,
    height: 156,
    alt: "Two golfers smiling together in a golf cart",
    altKey: "imageAlt.friendsGolfCart",
  },
  coastalCliffHole: {
    src: "/images/20_coastal_cliff_golf_hole.png",
    width: 335,
    height: 156,
    alt: "Dramatic golf hole perched on coastal cliffs above the sea",
    altKey: "imageAlt.coastalCliffHole",
  },
  tournamentCompetition: {
    src: "/images/21_tournament_competition.png",
    width: 294,
    height: 149,
    alt: "Golfer driving off the tee in front of a tournament crowd",
    altKey: "imageAlt.tournamentCompetition",
  },
  travelGolfTrip: {
    src: "/images/22_travel_golf_trip.png",
    width: 285,
    height: 149,
    alt: "Golfer carrying a travel bag through an airport walkway",
    altKey: "imageAlt.travelGolfTrip",
  },
  creatorVloggingGolf: {
    src: "/images/23_creator_vlogging_golf.png",
    width: 291,
    height: 149,
    alt: "Golf creator filming herself with a camera gimbal on the course",
    altKey: "imageAlt.creatorVloggingGolf",
  },
  juniorGolferSwing: {
    src: "/images/24_junior_golfer_swing.png",
    width: 295,
    height: 149,
    alt: "Junior golfer practising an iron swing",
    altKey: "imageAlt.juniorGolferSwing",
  },
  aerialGolfHole: {
    src: "/images/25_aerial_golf_hole.png",
    width: 335,
    height: 149,
    alt: "Aerial view of an island green surrounded by bunkers and water",
    altKey: "imageAlt.aerialGolfHole",
  },
} as const satisfies Record<string, SiteImage>;
