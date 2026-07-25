import { images, type SiteImage } from "@/lib/content/images";

/**
 * Fictional Preview creators for the Discover page.
 *
 * NONE of these are real people, goals or amounts. Every card that renders
 * this data must carry a "Preview" (or "Concept") label per ADR-007 and the
 * CLAUDE.md hard rules. The Discover page shows this illustrative content only
 * while a section has no real creators yet; real data replaces it as creators
 * join. Amounts are whole pounds (converted to minor units at render time).
 *
 * Localisation: translatable strings (bios, goal titles/descriptions,
 * locations, update notes) live in the `content` message namespace
 * (`messages/<locale>/content.json`); the key-based `previewCreatorItems`
 * export references them (keys are relative to the `content` namespace, e.g.
 * `useTranslations("content")` then `t(item.bioKey)`). Persona NAMES are
 * fictional proper nouns and deliberately stay as plain data here — names
 * don't translate. Amounts, categories, images and dates stay in TS. The
 * English-string exports remain as deprecated fallbacks until consumers
 * migrate.
 */

export type PreviewCreator = {
  name: string;
  /** Discover category slug (see lib/discover/categories.ts). */
  category: string;
  location: string;
  country: string;
  bio: string;
  image: SiteImage;
  goal: {
    title: string;
    description: string;
    /** Whole pounds — illustrative only. */
    raised: number;
    target: number;
  };
  /** Illustrative "recently posted an update" line, when relevant. */
  updateNote?: string;
  /** ISO date used only to order Preview "new"/"updated" sections deterministically. */
  joined: string;
};

/** Locale-aware shape: stable id + message-key references, no raw English. */
export type PreviewCreatorItem = {
  id: string;
  /** Fictional persona name — proper noun, not translated. */
  name: string;
  /** Discover category slug (see lib/discover/categories.ts). */
  category: string;
  /** Key in the `content` namespace, e.g. "previewCreators.coachDan.location". */
  locationKey: string;
  /** Key in the `content` namespace. */
  countryKey: string;
  /** Key in the `content` namespace. */
  bioKey: string;
  image: SiteImage;
  goal: {
    /** Key in the `content` namespace. */
    titleKey: string;
    /** Key in the `content` namespace. */
    descriptionKey: string;
    /** Whole pounds — illustrative only. */
    raised: number;
    target: number;
  };
  /** Key in the `content` namespace; `undefined` when the creator has no update line. */
  updateNoteKey: string | undefined;
  /** ISO date used only to order Preview "new"/"updated" sections deterministically. */
  joined: string;
};

export const previewCreatorItems = [
  {
    id: "caddieLive",
    name: "Caddie Live",
    category: "golf-apps",
    locationKey: "previewCreators.caddieLive.location",
    countryKey: "previewCreators.caddieLive.country",
    bioKey: "previewCreators.caddieLive.bio",
    image: images.creatorVloggingGolf,
    goal: {
      titleKey: "previewCreators.caddieLive.goalTitle",
      descriptionKey: "previewCreators.caddieLive.goalDescription",
      raised: 8400,
      target: 10000,
    },
    updateNoteKey: "previewCreators.caddieLive.updateNote",
    joined: "2026-07-20",
  },
  {
    id: "sarahBell",
    name: "Sarah Bell",
    category: "content-creators",
    locationKey: "previewCreators.sarahBell.location",
    countryKey: "previewCreators.sarahBell.country",
    bioKey: "previewCreators.sarahBell.bio",
    image: images.womanFullSwing,
    goal: {
      titleKey: "previewCreators.sarahBell.goalTitle",
      descriptionKey: "previewCreators.sarahBell.goalDescription",
      raised: 3200,
      target: 5000,
    },
    updateNoteKey: "previewCreators.sarahBell.updateNote",
    joined: "2026-07-22",
  },
  {
    id: "jackMorrison",
    name: "Jack Morrison",
    category: "professional-golfers",
    locationKey: "previewCreators.jackMorrison.location",
    countryKey: "previewCreators.jackMorrison.country",
    bioKey: "previewCreators.jackMorrison.bio",
    image: images.tournamentCompetition,
    goal: {
      titleKey: "previewCreators.jackMorrison.goalTitle",
      descriptionKey: "previewCreators.jackMorrison.goalDescription",
      raised: 4600,
      target: 5000,
    },
    updateNoteKey: "previewCreators.jackMorrison.updateNote",
    joined: "2026-07-18",
  },
  {
    id: "priyaShah",
    name: "Priya Shah",
    category: "amateurs",
    locationKey: "previewCreators.priyaShah.location",
    countryKey: "previewCreators.priyaShah.country",
    bioKey: "previewCreators.priyaShah.bio",
    image: images.womanReadingPutt,
    goal: {
      titleKey: "previewCreators.priyaShah.goalTitle",
      descriptionKey: "previewCreators.priyaShah.goalDescription",
      raised: 640,
      target: 1200,
    },
    updateNoteKey: undefined,
    joined: "2026-07-23",
  },
  {
    id: "firstTeeNorth",
    name: "First Tee North",
    category: "junior-golf",
    locationKey: "previewCreators.firstTeeNorth.location",
    countryKey: "previewCreators.firstTeeNorth.country",
    bioKey: "previewCreators.firstTeeNorth.bio",
    image: images.juniorGolferSwing,
    goal: {
      titleKey: "previewCreators.firstTeeNorth.goalTitle",
      descriptionKey: "previewCreators.firstTeeNorth.goalDescription",
      raised: 2700,
      target: 3000,
    },
    updateNoteKey: "previewCreators.firstTeeNorth.updateNote",
    joined: "2026-07-15",
  },
  {
    id: "callumReid",
    name: "Callum Reid",
    category: "golf-trips",
    locationKey: "previewCreators.callumReid.location",
    countryKey: "previewCreators.callumReid.country",
    bioKey: "previewCreators.callumReid.bio",
    image: images.linksCourseAerial,
    goal: {
      titleKey: "previewCreators.callumReid.goalTitle",
      descriptionKey: "previewCreators.callumReid.goalDescription",
      raised: 540,
      target: 1000,
    },
    updateNoteKey: "previewCreators.callumReid.updateNote",
    joined: "2026-07-21",
  },
  {
    id: "fairwaySociety",
    name: "Fairway Society",
    category: "golf-societies",
    locationKey: "previewCreators.fairwaySociety.location",
    countryKey: "previewCreators.fairwaySociety.country",
    bioKey: "previewCreators.fairwaySociety.bio",
    image: images.friendsWalkingFairway,
    goal: {
      titleKey: "previewCreators.fairwaySociety.goalTitle",
      descriptionKey: "previewCreators.fairwaySociety.goalDescription",
      raised: 820,
      target: 1500,
    },
    updateNoteKey: undefined,
    joined: "2026-07-19",
  },
  {
    id: "coachDan",
    name: "Coach Dan",
    category: "golf-coaches",
    locationKey: "previewCreators.coachDan.location",
    countryKey: "previewCreators.coachDan.country",
    bioKey: "previewCreators.coachDan.bio",
    image: images.putterAndBall,
    goal: {
      titleKey: "previewCreators.coachDan.goalTitle",
      descriptionKey: "previewCreators.coachDan.goalDescription",
      raised: 7600,
      target: 8000,
    },
    updateNoteKey: "previewCreators.coachDan.updateNote",
    joined: "2026-07-16",
  },
  {
    id: "linksCamera",
    name: "Links Camera",
    category: "golf-photography",
    locationKey: "previewCreators.linksCamera.location",
    countryKey: "previewCreators.linksCamera.country",
    bioKey: "previewCreators.linksCamera.bio",
    image: images.coastalCliffHole,
    goal: {
      titleKey: "previewCreators.linksCamera.goalTitle",
      descriptionKey: "previewCreators.linksCamera.goalDescription",
      raised: 430,
      target: 900,
    },
    updateNoteKey: "previewCreators.linksCamera.updateNote",
    joined: "2026-07-22",
  },
  {
    id: "backNinePod",
    name: "The Back Nine Pod",
    category: "golf-podcasts",
    locationKey: "previewCreators.backNinePod.location",
    countryKey: "previewCreators.backNinePod.country",
    bioKey: "previewCreators.backNinePod.bio",
    image: images.clubhouseEvening,
    goal: {
      titleKey: "previewCreators.backNinePod.goalTitle",
      descriptionKey: "previewCreators.backNinePod.goalDescription",
      raised: 1100,
      target: 2000,
    },
    updateNoteKey: undefined,
    joined: "2026-07-17",
  },
  {
    id: "meganFrost",
    name: "Megan Frost",
    category: "equipment-testing",
    locationKey: "previewCreators.meganFrost.location",
    countryKey: "previewCreators.meganFrost.country",
    bioKey: "previewCreators.meganFrost.bio",
    image: images.golferDriverSwing,
    goal: {
      titleKey: "previewCreators.meganFrost.goalTitle",
      descriptionKey: "previewCreators.meganFrost.goalDescription",
      raised: 380,
      target: 800,
    },
    updateNoteKey: undefined,
    joined: "2026-07-20",
  },
  {
    id: "clubhouseRevival",
    name: "Clubhouse Revival",
    category: "club-projects",
    locationKey: "previewCreators.clubhouseRevival.location",
    countryKey: "previewCreators.clubhouseRevival.country",
    bioKey: "previewCreators.clubhouseRevival.bio",
    image: images.mountainCourseView,
    goal: {
      titleKey: "previewCreators.clubhouseRevival.goalTitle",
      descriptionKey: "previewCreators.clubhouseRevival.goalDescription",
      raised: 9100,
      target: 10000,
    },
    updateNoteKey: "previewCreators.clubhouseRevival.updateNote",
    joined: "2026-07-14",
  },
] as const satisfies readonly PreviewCreatorItem[];

/**
 * @deprecated English-only strings. Use `previewCreatorItems` with the
 * `content` message namespace instead.
 */
export const previewCreators: PreviewCreator[] = [
  {
    name: "Caddie Live",
    category: "golf-apps",
    location: "Manchester",
    country: "England",
    bio: "A live scoring and course-mapping app built by golfers, for golfers.",
    image: images.creatorVloggingGolf,
    goal: {
      title: "Add 10,000 golf courses",
      description:
        "Mapping and verifying ten thousand courses so every round is covered.",
      raised: 8400,
      target: 10000,
    },
    updateNote: "Posted: 6,200 courses mapped and counting.",
    joined: "2026-07-20",
  },
  {
    name: "Sarah Bell",
    category: "content-creators",
    location: "St Andrews",
    country: "Scotland",
    bio: "Filming an honest, unsponsored look at life around the home of golf.",
    image: images.womanFullSwing,
    goal: {
      title: "New YouTube documentary",
      description:
        "A four-part series on the people who keep links golf alive.",
      raised: 3200,
      target: 5000,
    },
    updateNote: "Posted: first cut of episode two is in.",
    joined: "2026-07-22",
  },
  {
    name: "Jack Morrison",
    category: "professional-golfers",
    location: "Portmarnock",
    country: "Ireland",
    bio: "Chasing a card the hard way — every start told from the inside.",
    image: images.tournamentCompetition,
    goal: {
      title: "Qualify for Q School",
      description: "Entry fees and travel for a full run at tour qualifying.",
      raised: 4600,
      target: 5000,
    },
    updateNote: "Posted: made the cut in the regional qualifier.",
    joined: "2026-07-18",
  },
  {
    name: "Priya Shah",
    category: "amateurs",
    location: "Gleneagles",
    country: "Scotland",
    bio: "Documenting every lesson and round on the way from 7.8 to scratch.",
    image: images.womanReadingPutt,
    goal: {
      title: "Scottish Amateur season",
      description: "Entry fees and travel for a full season of amateur events.",
      raised: 640,
      target: 1200,
    },
    joined: "2026-07-23",
  },
  {
    name: "First Tee North",
    category: "junior-golf",
    location: "Leeds",
    country: "England",
    bio: "Getting clubs into the hands of kids who would never otherwise play.",
    image: images.juniorGolferSwing,
    goal: {
      title: "Junior golf programme",
      description: "A season of free coaching and equipment for 40 juniors.",
      raised: 2700,
      target: 3000,
    },
    updateNote: "Posted: 28 juniors signed up for the summer.",
    joined: "2026-07-15",
  },
  {
    name: "Callum Reid",
    category: "golf-trips",
    location: "Ayrshire",
    country: "Scotland",
    bio: "Playing and filming historic links courses along the Scottish coast.",
    image: images.linksCourseAerial,
    goal: {
      title: "Scotland Links Trip",
      description: "Five historic links courses, filmed over ten days.",
      raised: 540,
      target: 1000,
    },
    updateNote: "Posted: itinerary locked for the west coast leg.",
    joined: "2026-07-21",
  },
  {
    name: "Fairway Society",
    category: "golf-societies",
    location: "Surrey",
    country: "England",
    bio: "A friendly society running affordable golf days across the south.",
    image: images.friendsWalkingFairway,
    goal: {
      title: "Society tour season",
      description: "Green fees and prizes for a full calendar of society days.",
      raised: 820,
      target: 1500,
    },
    joined: "2026-07-19",
  },
  {
    name: "Coach Dan",
    category: "golf-coaches",
    location: "Bristol",
    country: "England",
    bio: "PGA coach building a home for year-round, all-weather practice.",
    image: images.putterAndBall,
    goal: {
      title: "Build an indoor coaching studio",
      description: "A launch monitor bay so lessons run through the winter.",
      raised: 7600,
      target: 8000,
    },
    updateNote: "Posted: the studio lease is signed.",
    joined: "2026-07-16",
  },
  {
    name: "Links Camera",
    category: "golf-photography",
    location: "Anglesey",
    country: "Wales",
    bio: "Fine-art photography of the coastal courses most golfers never see.",
    image: images.coastalCliffHole,
    goal: {
      title: "Coastal courses photo series",
      description: "A printed collection of thirty overlooked seaside holes.",
      raised: 430,
      target: 900,
    },
    updateNote: "Posted: shot the par-3 at first light this week.",
    joined: "2026-07-22",
  },
  {
    name: "The Back Nine Pod",
    category: "golf-podcasts",
    location: "Edinburgh",
    country: "Scotland",
    bio: "Two mates, one mic, and a genuine love for the amateur game.",
    image: images.clubhouseEvening,
    goal: {
      title: "Season two studio kit",
      description: "Proper mics and acoustic treatment for a cleaner sound.",
      raised: 1100,
      target: 2000,
    },
    joined: "2026-07-17",
  },
  {
    name: "Megan Frost",
    category: "equipment-testing",
    location: "Kent",
    country: "England",
    bio: "Independent, unsponsored testing of the gear everyday golfers buy.",
    image: images.golferDriverSwing,
    goal: {
      title: "Independent equipment testing",
      description: "A year of honest reviews, funded by golfers not brands.",
      raised: 380,
      target: 800,
    },
    joined: "2026-07-20",
  },
  {
    name: "Clubhouse Revival",
    category: "club-projects",
    location: "Fife",
    country: "Scotland",
    bio: "A member-led project restoring a much-loved century-old clubhouse.",
    image: images.mountainCourseView,
    goal: {
      title: "Restore the old clubhouse",
      description: "Repairing the roof and reopening the members' room.",
      raised: 9100,
      target: 10000,
    },
    updateNote: "Posted: the new roof timbers arrived on site.",
    joined: "2026-07-14",
  },
];

/**
 * Fictional "Recently Funded" activity — a Concept of the social-proof feed.
 * No real supporters, creators or gifts. Rendered under a Concept label only.
 */
export type PreviewActivity = {
  supporter: string;
  action: string;
  target: string;
};

/** Locale-aware shape: stable id + message-key references, no raw English. */
export type PreviewActivityItem = {
  id: string;
  /** Key in the `content` namespace, e.g. "previewActivity.sarahBellTee.supporter". */
  supporterKey: string;
  /** Key in the `content` namespace. */
  actionKey: string;
  /** Key in the `content` namespace. */
  targetKey: string;
};

export const previewActivityItems = [
  {
    id: "sarahBellTee",
    supporterKey: "previewActivity.sarahBellTee.supporter",
    actionKey: "previewActivity.sarahBellTee.action",
    targetKey: "previewActivity.sarahBellTee.target",
  },
  {
    id: "coachDanStudio",
    supporterKey: "previewActivity.coachDanStudio.supporter",
    actionKey: "previewActivity.coachDanStudio.action",
    targetKey: "previewActivity.coachDanStudio.target",
  },
  {
    id: "juniorProgramme",
    supporterKey: "previewActivity.juniorProgramme.supporter",
    actionKey: "previewActivity.juniorProgramme.action",
    targetKey: "previewActivity.juniorProgramme.target",
  },
  {
    id: "caddieLiveTee",
    supporterKey: "previewActivity.caddieLiveTee.supporter",
    actionKey: "previewActivity.caddieLiveTee.action",
    targetKey: "previewActivity.caddieLiveTee.target",
  },
  {
    id: "jackMorrisonQSchool",
    supporterKey: "previewActivity.jackMorrisonQSchool.supporter",
    actionKey: "previewActivity.jackMorrisonQSchool.action",
    targetKey: "previewActivity.jackMorrisonQSchool.target",
  },
  {
    id: "scotlandLinksTrip",
    supporterKey: "previewActivity.scotlandLinksTrip.supporter",
    actionKey: "previewActivity.scotlandLinksTrip.action",
    targetKey: "previewActivity.scotlandLinksTrip.target",
  },
] as const satisfies readonly PreviewActivityItem[];

/**
 * @deprecated English-only strings. Use `previewActivityItems` with the
 * `content` message namespace instead.
 */
export const previewActivity: PreviewActivity[] = [
  { supporter: "Alex", action: "bought", target: "Sarah Bell a Tee" },
  { supporter: "Jordan", action: "supported", target: "Coach Dan's studio" },
  { supporter: "Anonymous", action: "backed", target: "the Junior golf programme" },
  { supporter: "Sam", action: "bought", target: "Caddie Live a Tee" },
  { supporter: "Rory", action: "supported", target: "Jack Morrison's Q School run" },
  { supporter: "Emily", action: "backed", target: "the Scotland Links Trip" },
];
