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
 */

export type SiteImage = {
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const images = {
  heroLinksGolfer: {
    src: "/images/01_hero_sunset_links_golfer.png",
    width: 330,
    height: 200,
    alt: "Golfer finishing a drive on a links course above the sea at sunset",
  },
  groupDiverseGolfers: {
    src: "/images/02_group_diverse_golfers.png",
    width: 356,
    height: 200,
    alt: "Four golfers chatting together beside their bags on the course",
  },
  womanReadingPutt: {
    src: "/images/03_woman_reading_putt.png",
    width: 240,
    height: 200,
    alt: "Golfer crouching on the green to read the line of a putt",
  },
  golferDriverSwing: {
    src: "/images/05_golfer_driver_swing.png",
    width: 306,
    height: 200,
    alt: "Golfer mid-swing with a driver against a bright sky",
  },
  friendsWalkingFairway: {
    src: "/images/06_friends_walking_fairway.png",
    width: 330,
    height: 174,
    alt: "Three friends carrying their bags down the fairway at golden hour",
  },
  linksCourseAerial: {
    src: "/images/07_links_course_aerial.png",
    width: 308,
    height: 174,
    alt: "Aerial view of a coastal links course winding along the shoreline",
  },
  clubhouseEvening: {
    src: "/images/08_clubhouse_evening.png",
    width: 295,
    height: 174,
    alt: "Stone clubhouse glowing with warm light in the evening",
  },
  golfBallCloseup: {
    src: "/images/10_golf_ball_closeup.png",
    width: 306,
    height: 174,
    alt: "Close-up of a golf ball sitting in dew-covered grass",
  },
  flagAtSunset: {
    src: "/images/11_flag_at_sunset.png",
    width: 320,
    height: 178,
    alt: "Pin flag silhouetted against a golden sunset sky",
  },
  womanFullSwing: {
    src: "/images/12_woman_full_swing.png",
    width: 278,
    height: 178,
    alt: "Golfer completing a full swing on the course",
  },
  golfersFistBump: {
    src: "/images/13_golfers_fist_bump.png",
    width: 279,
    height: 178,
    alt: "Two golfers sharing a fist bump on the course by the sea",
  },
  mountainCourseView: {
    src: "/images/14_mountain_course_view.png",
    width: 279,
    height: 178,
    alt: "Golf course set in a green mountain valley beside a lake",
  },
  bunkerShotAction: {
    src: "/images/15_bunker_shot_action.png",
    width: 348,
    height: 178,
    alt: "Golfer splashing sand while playing out of a bunker",
  },
  womanSunriseView: {
    src: "/images/16_woman_sunrise_view.png",
    width: 294,
    height: 156,
    alt: "Golfer looking out over the course at sunrise",
  },
  putterAndBall: {
    src: "/images/17_putter_and_ball_closeup.png",
    width: 285,
    height: 156,
    alt: "Putter and ball beside the hole on a practice green",
  },
  friendsGolfCart: {
    src: "/images/19_friends_golf_cart.png",
    width: 295,
    height: 156,
    alt: "Two golfers smiling together in a golf cart",
  },
  coastalCliffHole: {
    src: "/images/20_coastal_cliff_golf_hole.png",
    width: 335,
    height: 156,
    alt: "Dramatic golf hole perched on coastal cliffs above the sea",
  },
  tournamentCompetition: {
    src: "/images/21_tournament_competition.png",
    width: 294,
    height: 149,
    alt: "Golfer driving off the tee in front of a tournament crowd",
  },
  travelGolfTrip: {
    src: "/images/22_travel_golf_trip.png",
    width: 285,
    height: 149,
    alt: "Golfer carrying a travel bag through an airport walkway",
  },
  creatorVloggingGolf: {
    src: "/images/23_creator_vlogging_golf.png",
    width: 291,
    height: 149,
    alt: "Golf creator filming herself with a camera gimbal on the course",
  },
  juniorGolferSwing: {
    src: "/images/24_junior_golfer_swing.png",
    width: 295,
    height: 149,
    alt: "Junior golfer practising an iron swing",
  },
  aerialGolfHole: {
    src: "/images/25_aerial_golf_hole.png",
    width: 335,
    height: 149,
    alt: "Aerial view of an island green surrounded by bunkers and water",
  },
} as const satisfies Record<string, SiteImage>;
