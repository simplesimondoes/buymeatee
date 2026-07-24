import { images, type SiteImage } from "@/lib/content/images";

/**
 * Fictional Preview creators for the Discover page.
 *
 * NONE of these are real people, goals or amounts. Every card that renders
 * this data must carry a "Preview" (or "Concept") label per ADR-007 and the
 * CLAUDE.md hard rules. The Discover page shows this illustrative content only
 * while a section has no real creators yet; real data replaces it as creators
 * join. Amounts are whole pounds (converted to minor units at render time).
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

export const previewActivity: PreviewActivity[] = [
  { supporter: "Alex", action: "bought", target: "Sarah Bell a Tee" },
  { supporter: "Jordan", action: "supported", target: "Coach Dan's studio" },
  { supporter: "Anonymous", action: "backed", target: "the Junior golf programme" },
  { supporter: "Sam", action: "bought", target: "Caddie Live a Tee" },
  { supporter: "Rory", action: "supported", target: "Jack Morrison's Q School run" },
  { supporter: "Emily", action: "backed", target: "the Scotland Links Trip" },
];
