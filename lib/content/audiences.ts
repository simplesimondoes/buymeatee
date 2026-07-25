import type { ComponentType } from "react";
import {
  GraduationCap,
  HandHeart,
  Landmark,
  Mic,
  Plane,
  Sprout,
  Target,
  Trophy,
  Video,
} from "lucide-react";

import { exampleGoalItems } from "@/lib/content/example-goals";
import { images, type SiteImage } from "@/lib/content/images";

/**
 * The nine audience segments behind "For Golfers With a Goal." (ADR-021).
 *
 * Single source of truth for the /for/[audience] landing pages, the homepage
 * audience grid, the /for-creators hub cards, the footer column and the
 * sitemap. Slugs are language-neutral and identical across locales (like blog
 * slugs); all display strings live in the `audiences` message namespace keyed
 * by `id`.
 */

export type Audience = {
  /** URL segment under /for/, language-neutral. */
  slug: string;
  /** Message-key id under the `audiences` namespace, e.g. "contentCreators". */
  id: string;
  icon: ComponentType<{ className?: string }>;
  /** Hero image (reused slot from the central image registry). */
  image: SiteImage;
  /** ids from `exampleGoalItems` shown on this page (2–3). */
  exampleGoalIds: readonly string[];
  /** Primary SEO target term — documents intent; used by tests as an anchor. */
  seoKeyword: string;
  /** Slugs for the cross-audience links strip (2–3). */
  related: readonly string[];
  /**
   * Junior page: the page is addressed to parents/guardians and renders a
   * prominent guardian notice (pages for juniors are always guardian-managed).
   */
  guardianLed?: true;
};

export const audiences = [
  {
    slug: "content-creators",
    id: "contentCreators",
    icon: Video,
    image: images.creatorVloggingGolf,
    exampleGoalIds: ["independentCourseReviews", "womensGolfSeries"],
    seoKeyword: "golf creator support",
    related: ["podcasters", "coaches", "travelling-players"],
  },
  {
    slug: "tournament-players",
    id: "tournamentPlayers",
    icon: Trophy,
    image: images.tournamentCompetition,
    exampleGoalIds: ["amateurChampionshipEntry", "firstProfessionalSeason"],
    seoKeyword: "amateur golf sponsorship",
    related: ["college-golfers", "travelling-players", "junior-golfers"],
  },
  {
    slug: "junior-golfers",
    id: "juniorGolfers",
    icon: Sprout,
    image: images.juniorGolferSwing,
    exampleGoalIds: ["juniorSeasonFund", "roadToScratch"],
    seoKeyword: "junior golf funding",
    related: ["tournament-players", "coaches", "college-golfers"],
    guardianLed: true,
  },
  {
    slug: "college-golfers",
    id: "collegeGolfers",
    icon: GraduationCap,
    image: images.groupDiverseGolfers,
    exampleGoalIds: ["amateurChampionshipEntry", "roadToScratch"],
    seoKeyword: "college golf fundraising",
    related: ["tournament-players", "junior-golfers", "travelling-players"],
  },
  {
    slug: "travelling-players",
    id: "travellingPlayers",
    icon: Plane,
    image: images.travelGolfTrip,
    exampleGoalIds: ["scotlandLinksTrip", "amateurChampionshipEntry"],
    seoKeyword: "golf tournament travel support",
    related: ["tournament-players", "content-creators", "charity-golfers"],
  },
  {
    slug: "charity-golfers",
    id: "charityGolfers",
    icon: HandHeart,
    image: images.friendsWalkingFairway,
    exampleGoalIds: ["charityChallengeRound", "womensGolfSeries"],
    seoKeyword: "charity golf challenge",
    related: ["club-professionals", "content-creators", "tournament-players"],
  },
  {
    slug: "club-professionals",
    id: "clubProfessionals",
    icon: Landmark,
    image: images.clubhouseEvening,
    exampleGoalIds: ["clubProTeachingSeries", "roadToScratch"],
    seoKeyword: "support a club professional",
    related: ["coaches", "charity-golfers", "content-creators"],
  },
  {
    slug: "coaches",
    id: "coaches",
    icon: Target,
    image: images.putterAndBall,
    exampleGoalIds: ["clubProTeachingSeries", "juniorSeasonFund"],
    seoKeyword: "golf coaching support",
    related: ["club-professionals", "junior-golfers", "content-creators"],
  },
  {
    slug: "podcasters",
    id: "podcasters",
    icon: Mic,
    image: images.friendsGolfCart,
    exampleGoalIds: ["podcastLaunch", "independentCourseReviews"],
    seoKeyword: "support a golf podcast",
    related: ["content-creators", "coaches", "travelling-players"],
  },
] as const satisfies readonly Audience[];

export type AudienceSlug = (typeof audiences)[number]["slug"];
export type AudienceId = (typeof audiences)[number]["id"];

export const audienceSlugs = audiences.map((audience) => audience.slug);

export function getAudience(slug: string): Audience | undefined {
  return audiences.find((audience) => audience.slug === slug);
}

export function getAudienceExampleGoals(audience: Audience) {
  return audience.exampleGoalIds
    .map((id) => exampleGoalItems.find((goal) => goal.id === id))
    .filter((goal) => goal !== undefined);
}
