import { audiences } from "@/lib/content/audiences";
import type { SocialPillar, SocialSlot } from "@/lib/social-studio/types";

/**
 * Pure calendar planning for the Social Content Studio (ADR-023).
 *
 * Two posts a day (14/week, inside the 14–18 target): a morning
 * conversation-starter and an afternoon value post. Pillars rotate so the six
 * pillars stay evenly distributed over a four-week window, and audience
 * spotlights rotate through the full audience registry so every segment gets
 * covered. Deterministic — no randomness — so seeding is reproducible and the
 * distribution is testable.
 */

export type SlotPlan = {
  /** ISO timestamp (UTC) the post is planned for. */
  scheduledFor: string;
  slot: SocialSlot;
  pillar: SocialPillar;
  /** Audience slug (spotlight slots only). */
  audience: string | null;
};

/** Posting times (UTC hours) — founder-friendly UK daytimes. */
const SLOT_HOURS: Record<SocialSlot, number> = { morning: 8, afternoon: 15 };

/**
 * Morning = generate conversation; afternoon = provide value. golfJourney
 * appears in both cycles, which keeps all six pillars within ±2 posts of one
 * another across 28 days.
 */
const MORNING_CYCLE: readonly SocialPillar[] = [
  "golfGoals",
  "brandMission",
  "golfJourney",
];
/**
 * Three spotlights per eight afternoons ≈ ten per four-week window — enough
 * to rotate through all nine audience segments inside a single window.
 */
const AFTERNOON_CYCLE: readonly SocialPillar[] = [
  "audienceSpotlights",
  "educational",
  "founderUpdates",
  "audienceSpotlights",
  "golfJourney",
  "educational",
  "audienceSpotlights",
  "founderUpdates",
];

export const DEFAULT_CALENDAR_DAYS = 28;

/** Spotlight slots in the afternoon cycle before position `remainder`. */
function spotlightsInPrefix(remainder: number): number {
  let count = 0;
  for (let i = 0; i < remainder; i += 1) {
    if (AFTERNOON_CYCLE[i] === "audienceSpotlights") {
      count += 1;
    }
  }
  return count;
}

const SPOTLIGHTS_PER_CYCLE = AFTERNOON_CYCLE.filter(
  (pillar) => pillar === "audienceSpotlights",
).length;

export function planCalendar({
  from,
  days = DEFAULT_CALENDAR_DAYS,
}: {
  /** First day to plan (time-of-day ignored). */
  from: Date;
  days?: number;
}): SlotPlan[] {
  const plans: SlotPlan[] = [];
  const audienceSlugs = audiences.map((audience) => audience.slug);

  for (let day = 0; day < days; day += 1) {
    // Rotations key off the ABSOLUTE day (days since epoch), not the window,
    // so seeding week-by-week produces exactly the same sequence as seeding
    // the whole month at once — no window restarts repeating the same
    // audiences or starving a pillar.
    const scheduledDayStart = Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate() + day,
    );
    const absoluteDay = Math.floor(scheduledDayStart / 86_400_000);

    for (const slot of ["morning", "afternoon"] as const) {
      const pillar =
        slot === "morning"
          ? MORNING_CYCLE[absoluteDay % MORNING_CYCLE.length]
          : AFTERNOON_CYCLE[absoluteDay % AFTERNOON_CYCLE.length];
      const audience =
        pillar === "audienceSpotlights"
          ? audienceSlugs[
              (SPOTLIGHTS_PER_CYCLE *
                Math.floor(absoluteDay / AFTERNOON_CYCLE.length) +
                spotlightsInPrefix(absoluteDay % AFTERNOON_CYCLE.length)) %
                audienceSlugs.length
            ]
          : null;
      plans.push({
        scheduledFor: new Date(
          scheduledDayStart + SLOT_HOURS[slot] * 3_600_000,
        ).toISOString(),
        slot,
        pillar,
        audience,
      });
    }
  }
  return plans;
}
