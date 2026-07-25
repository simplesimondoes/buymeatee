import "server-only";

import { previewCreators } from "@/lib/content/preview-creators";
import { goalProgressPercent } from "@/lib/goals/types";
import {
  listPublicCreators,
  listPublicGoals,
  listRecentlyUpdated,
  type PublicGoalRow,
} from "@/lib/discover/queries";
import type {
  DiscoverCreatorCard,
  DiscoverData,
  DiscoverGoalCard,
  DiscoverSection,
} from "@/lib/discover/types";

/**
 * Assembles the Discover page.
 *
 * Hybrid by design: sections render real, verified data when it exists and
 * fall back to clearly-labelled Preview content (ADR-007) while the platform
 * is still filling up. Trending and the Recently Funded feed have no data
 * pipeline yet (no view/velocity tracking, no public gift feed), so they are
 * always shown as Preview/Concept until that pipeline exists.
 *
 * If Supabase is not configured, every real read fails safely to empty and the
 * whole page renders as an honest Preview — it never invents real activity.
 */

const FEATURED = 8;

function section<T>(real: T[], preview: T[], take: number): DiscoverSection<T> {
  return real.length > 0
    ? { items: real.slice(0, take), preview: false }
    : { items: preview.slice(0, take), preview: true };
}

function realGoalCard(row: PublicGoalRow): DiscoverGoalCard {
  const percent = goalProgressPercent(row.raised_amount, row.target_amount);
  const name = row.creator?.display_name || row.creator?.username || "A creator";
  return {
    key: `goal-${row.id}`,
    title: row.title,
    description: row.description,
    imageSrc: row.cover_image_url ?? row.creator?.cover_image_url ?? null,
    imageAlt: "",
    creatorName: name,
    creatorHref: row.creator?.username ? `/t/${row.creator.username}` : null,
    location: row.creator?.location ?? null,
    country: row.creator?.country ?? null,
    category: null,
    raisedMinor: row.raised_amount,
    targetMinor: row.target_amount,
    currency: row.currency,
    percent,
    started: row.raised_amount > 0,
    isPreview: false,
    createdAt: row.created_at,
  };
}

const previewGoalCards: DiscoverGoalCard[] = previewCreators.map((creator) => {
  const raisedMinor = creator.goal.raised * 100;
  const targetMinor = creator.goal.target * 100;
  return {
    key: `preview-goal-${creator.name}`,
    title: creator.goal.title,
    description: creator.goal.description,
    imageSrc: creator.image.src,
    imageAlt: creator.image.alt,
    creatorName: creator.name,
    creatorHref: null,
    location: creator.location,
    country: creator.country,
    category: creator.category,
    raisedMinor,
    targetMinor,
    currency: "gbp",
    percent: goalProgressPercent(raisedMinor, targetMinor),
    started: raisedMinor > 0,
    isPreview: true,
    createdAt: creator.joined,
  };
});

const previewCreatorCards: DiscoverCreatorCard[] = previewCreators.map(
  (creator) => {
    const percent = goalProgressPercent(
      creator.goal.raised * 100,
      creator.goal.target * 100,
    );
    return {
      key: `preview-creator-${creator.name}`,
      name: creator.name,
      href: null,
      avatarUrl: null,
      imageSrc: creator.image.src,
      imageAlt: creator.image.alt,
      bio: creator.bio,
      location: creator.location,
      country: creator.country,
      category: creator.category,
      currentGoal: {
        title: creator.goal.title,
        percent,
        started: true,
      },
      updateNote: creator.updateNote ?? null,
      isPreview: true,
      createdAt: creator.joined,
    };
  },
);

export async function getDiscoverData(): Promise<DiscoverData> {
  const [creators, goals, updates] = await Promise.all([
    listPublicCreators().catch(() => []),
    listPublicGoals().catch(() => []),
    listRecentlyUpdated().catch(() => []),
  ]);

  // Real goal cards, and a map of each creator's current (active) goal.
  const realGoalCards = goals.map(realGoalCard);
  const currentGoalByCreator = new Map<string, PublicGoalRow>();
  for (const row of goals) {
    const existing = currentGoalByCreator.get(row.creator_id);
    // Prefer an active goal; among active, keep the most recently updated.
    if (!existing || (existing.status !== "active" && row.status === "active")) {
      currentGoalByCreator.set(row.creator_id, row);
    }
  }

  // A discoverable creator is anyone with a public page (role 'creator') OR
  // anyone with a publicly-visible goal — the `role` flag alone would hide
  // real creators who set up a goal without it being toggled.
  type CreatorInfo = {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    cover_image_url: string | null;
    bio: string | null;
    location: string | null;
    country: string | null;
    created_at: string;
  };
  const creatorInfoById = new Map<string, CreatorInfo>();
  for (const creator of creators) {
    if (!creator.username) continue;
    creatorInfoById.set(creator.id, creator as CreatorInfo);
  }
  for (const row of goals) {
    if (!row.creator?.username || creatorInfoById.has(row.creator_id)) continue;
    // Derived from the goal's creator join — less rich (no bio), but real.
    creatorInfoById.set(row.creator_id, {
      id: row.creator_id,
      username: row.creator.username,
      display_name: row.creator.display_name,
      avatar_url: row.creator.avatar_url,
      cover_image_url: row.creator.cover_image_url,
      bio: null,
      location: row.creator.location,
      country: row.creator.country,
      created_at: row.created_at,
    });
  }

  const realCreatorCards: DiscoverCreatorCard[] = Array.from(
    creatorInfoById.values(),
  ).map((creator) => {
    const goal = currentGoalByCreator.get(creator.id);
    return {
      key: `creator-${creator.id}`,
      name: creator.display_name || creator.username,
      href: `/t/${creator.username}`,
      avatarUrl: creator.avatar_url,
      imageSrc: creator.cover_image_url,
      imageAlt: "",
      bio: creator.bio,
      location: creator.location,
      country: creator.country,
      category: null,
      currentGoal: goal
        ? {
            title: goal.title,
            percent: goalProgressPercent(goal.raised_amount, goal.target_amount),
            started: goal.raised_amount > 0,
          }
        : null,
      updateNote: null,
      isPreview: false,
      createdAt: creator.created_at,
    };
  });

  const creatorById = new Map(realCreatorCards.map((c) => [c.key, c]));

  // Featured goals: most-backed first, then newest.
  const featuredRealGoals = [...realGoalCards].sort(
    (a, b) => b.raisedMinor - a.raisedMinor || b.createdAt.localeCompare(a.createdAt),
  );

  // Near completion: 80–95% of the way there.
  const inHomeStretch = (g: DiscoverGoalCard) => g.percent >= 80 && g.percent <= 95;
  const realNear = featuredRealGoals.filter(inHomeStretch);
  const previewNear = [...previewGoalCards]
    .filter(inHomeStretch)
    .sort((a, b) => b.percent - a.percent);

  // New creators: newest first.
  const realNewCreators = [...realCreatorCards].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const previewNewCreators = [...previewCreatorCards].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  // Recently updated: real from published updates (deduped, in update order).
  const realUpdated: DiscoverCreatorCard[] = [];
  const seen = new Set<string>();
  for (const update of updates) {
    const key = `creator-${update.creator_id}`;
    if (seen.has(key)) continue;
    const card = creatorById.get(key);
    if (card) {
      realUpdated.push({ ...card, updateNote: update.title });
      seen.add(key);
    }
  }
  const previewUpdated = previewCreatorCards.filter((c) => c.updateNote);

  // Trending: no velocity/view pipeline yet — always Preview (ordered by pace).
  const trendingPreview = [...previewGoalCards].sort(
    (a, b) => b.percent - a.percent,
  );

  return {
    featuredCreators: section(realCreatorCards, previewCreatorCards, FEATURED),
    featuredGoals: section(featuredRealGoals, previewGoalCards, FEATURED),
    recentlyUpdated: section(realUpdated, previewUpdated, FEATURED),
    trending: { items: trendingPreview.slice(0, FEATURED), preview: true },
    nearCompletion: section(realNear, previewNear, FEATURED),
    newCreators: section(realNewCreators, previewNewCreators, FEATURED),
    allGoals: [...realGoalCards, ...previewGoalCards],
    allCreators: [...realCreatorCards, ...previewCreatorCards],
  };
}
