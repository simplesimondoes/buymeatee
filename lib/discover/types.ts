import type { SupportedCurrency } from "@/lib/payments/currency";

/**
 * View models for the Discover page. These deliberately carry only public,
 * display-safe fields — never Stripe ids, emails or moderation state.
 *
 * `isPreview` marks fictional, clearly-labelled content (ADR-007). Real cards
 * (isPreview === false) are built only from verified, publicly-visible data:
 * published goals and their raised amounts come from the webhook path, so
 * progress can never be invented.
 */

export type DiscoverGoalCard = {
  key: string;
  title: string;
  description: string | null;
  imageSrc: string | null;
  imageAlt: string;
  creatorName: string;
  /** Link to the creator's public page, or null for Preview content. */
  creatorHref: string | null;
  location: string | null;
  country: string | null;
  category: string | null;
  raisedMinor: number;
  targetMinor: number;
  currency: SupportedCurrency;
  percent: number;
  started: boolean;
  isPreview: boolean;
  /** ISO timestamp used for "newest" ordering. */
  createdAt: string;
};

export type DiscoverCreatorCard = {
  key: string;
  name: string;
  href: string | null;
  avatarUrl: string | null;
  imageSrc: string | null;
  imageAlt: string;
  bio: string | null;
  location: string | null;
  country: string | null;
  category: string | null;
  currentGoal: {
    title: string;
    percent: number;
    started: boolean;
  } | null;
  updateNote: string | null;
  isPreview: boolean;
  createdAt: string;
};

/**
 * Everything the Discover page renders. Each curated section is accompanied by
 * a `preview` flag so the UI can show a Preview eyebrow when a section is
 * illustrative (no real data yet).
 */
export type DiscoverSection<T> = {
  items: T[];
  preview: boolean;
};

export type DiscoverData = {
  featuredCreators: DiscoverSection<DiscoverCreatorCard>;
  featuredGoals: DiscoverSection<DiscoverGoalCard>;
  recentlyUpdated: DiscoverSection<DiscoverCreatorCard>;
  trending: DiscoverSection<DiscoverGoalCard>;
  nearCompletion: DiscoverSection<DiscoverGoalCard>;
  newCreators: DiscoverSection<DiscoverCreatorCard>;
  /** The full searchable set (real + preview) for the browse/filter section. */
  allGoals: DiscoverGoalCard[];
  allCreators: DiscoverCreatorCard[];
};
