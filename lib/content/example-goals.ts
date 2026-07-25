import { images, type SiteImage } from "@/lib/content/images";

/**
 * Fictional example goals for the homepage grid.
 * Every entry is rendered with an explicit "Example" label (ADR-007) —
 * these are not real creators or real amounts.
 *
 * Localisation: display strings live in the `content` message namespace
 * (`messages/<locale>/content.json`); the key-based `exampleGoalItems`
 * export references them (keys are relative to the `content` namespace, e.g.
 * `useTranslations("content")` then `t(item.titleKey)`). Amounts stay in TS —
 * they are illustrative numbers, not translatable copy. The English-string
 * `exampleGoals` export remains as a deprecated fallback until consumers
 * migrate.
 */

export type ExampleGoal = {
  title: string;
  creator: string;
  description: string;
  raised: number;
  target: number;
  image: SiteImage;
};

/** Locale-aware shape: stable id + message-key references, no raw English. */
export type ExampleGoalItem = {
  id: string;
  /** Key in the `content` namespace, e.g. "exampleGoals.roadToScratch.title". */
  titleKey: string;
  /** Key in the `content` namespace (fictional persona name). */
  creatorKey: string;
  /** Key in the `content` namespace. */
  descriptionKey: string;
  raised: number;
  target: number;
  image: SiteImage;
};

export function goalProgress(goal: {
  raised: number;
  target: number;
}): number {
  return Math.round((goal.raised / goal.target) * 100);
}

export const exampleGoalItems = [
  {
    id: "scotlandLinksTrip",
    titleKey: "exampleGoals.scotlandLinksTrip.title",
    creatorKey: "exampleGoals.scotlandLinksTrip.creator",
    descriptionKey: "exampleGoals.scotlandLinksTrip.description",
    raised: 540,
    target: 1000,
    image: images.linksCourseAerial,
  },
  {
    id: "roadToScratch",
    titleKey: "exampleGoals.roadToScratch.title",
    creatorKey: "exampleGoals.roadToScratch.creator",
    descriptionKey: "exampleGoals.roadToScratch.description",
    raised: 640,
    target: 1200,
    image: images.womanReadingPutt,
  },
  {
    id: "amateurChampionshipEntry",
    titleKey: "exampleGoals.amateurChampionshipEntry.title",
    creatorKey: "exampleGoals.amateurChampionshipEntry.creator",
    descriptionKey: "exampleGoals.amateurChampionshipEntry.description",
    raised: 210,
    target: 600,
    image: images.tournamentCompetition,
  },
  {
    id: "independentCourseReviews",
    titleKey: "exampleGoals.independentCourseReviews.title",
    creatorKey: "exampleGoals.independentCourseReviews.creator",
    descriptionKey: "exampleGoals.independentCourseReviews.description",
    raised: 380,
    target: 800,
    image: images.coastalCliffHole,
  },
  {
    id: "firstProfessionalSeason",
    titleKey: "exampleGoals.firstProfessionalSeason.title",
    creatorKey: "exampleGoals.firstProfessionalSeason.creator",
    descriptionKey: "exampleGoals.firstProfessionalSeason.description",
    raised: 1150,
    target: 2500,
    image: images.bunkerShotAction,
  },
  {
    id: "womensGolfSeries",
    titleKey: "exampleGoals.womensGolfSeries.title",
    creatorKey: "exampleGoals.womensGolfSeries.creator",
    descriptionKey: "exampleGoals.womensGolfSeries.description",
    raised: 460,
    target: 900,
    image: images.womanFullSwing,
  },
] as const satisfies readonly ExampleGoalItem[];

/**
 * @deprecated English-only strings. Use `exampleGoalItems` with the
 * `content` message namespace instead.
 */
export const exampleGoals: ExampleGoal[] = [
  {
    title: "Scotland Links Trip",
    creator: "Callum Reid",
    description:
      "Playing and filming five historic links courses along the Scottish coast.",
    raised: 540,
    target: 1000,
    image: images.linksCourseAerial,
  },
  {
    title: "Road to Scratch",
    creator: "Priya Shah",
    description:
      "Documenting every lesson and round on the way from 7.8 to scratch.",
    raised: 640,
    target: 1200,
    image: images.womanReadingPutt,
  },
  {
    title: "Amateur Championship Entry",
    creator: "Tom Fletcher",
    description:
      "Entry fees and travel for a full season of regional amateur events.",
    raised: 210,
    target: 600,
    image: images.tournamentCompetition,
  },
  {
    title: "Independent Course Reviews",
    creator: "Megan Frost",
    description:
      "Honest, unsponsored reviews of the courses everyday golfers actually play.",
    raised: 380,
    target: 800,
    image: images.coastalCliffHole,
  },
  {
    title: "First Professional Season",
    creator: "Dan Whitmore",
    description:
      "Chasing status on the mini-tours — every start, told from the inside.",
    raised: 1150,
    target: 2500,
    image: images.bunkerShotAction,
  },
  {
    title: "Women's Golf Content Series",
    creator: "Lauren Park",
    description:
      "A video series getting more women into the game, one round at a time.",
    raised: 460,
    target: 900,
    image: images.womanFullSwing,
  },
];
