import { images, type SiteImage } from "@/lib/content/images";

/**
 * Fictional example goals for the homepage grid.
 * Every entry is rendered with an explicit "Example" label (ADR-007) —
 * these are not real creators or real amounts.
 */

export type ExampleGoal = {
  title: string;
  creator: string;
  description: string;
  raised: number;
  target: number;
  image: SiteImage;
};

export function goalProgress(goal: ExampleGoal): number {
  return Math.round((goal.raised / goal.target) * 100);
}

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
