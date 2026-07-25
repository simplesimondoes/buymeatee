import { describe, expect, it } from "vitest";

import { audiences } from "@/lib/content/audiences";
import { planCalendar } from "@/lib/social-studio/calendar";
import { SOCIAL_PILLARS } from "@/lib/social-studio/types";

describe("planCalendar", () => {
  const plans = planCalendar({ from: new Date("2026-07-27T00:00:00Z") });

  it("plans two posts a day for four weeks (14/week, within the 14–18 target)", () => {
    expect(plans).toHaveLength(56);
    const perDay = new Map<string, number>();
    for (const plan of plans) {
      const day = plan.scheduledFor.slice(0, 10);
      perDay.set(day, (perDay.get(day) ?? 0) + 1);
    }
    expect(perDay.size).toBe(28);
    for (const count of perDay.values()) {
      expect(count).toBe(2);
    }
  });

  it("gives every day one morning and one afternoon slot at fixed times", () => {
    for (const plan of plans) {
      const hour = new Date(plan.scheduledFor).getUTCHours();
      expect(plan.slot === "morning" ? hour : null).toSatisfy(
        (value: number | null) => value === null || value === 8,
      );
      expect(plan.slot === "afternoon" ? hour : null).toSatisfy(
        (value: number | null) => value === null || value === 15,
      );
    }
  });

  it("distributes all six pillars roughly evenly", () => {
    const counts = new Map<string, number>();
    for (const plan of plans) {
      counts.set(plan.pillar, (counts.get(plan.pillar) ?? 0) + 1);
    }
    // Every pillar appears, and none dominates.
    for (const pillar of SOCIAL_PILLARS) {
      const count = counts.get(pillar) ?? 0;
      expect(count, pillar).toBeGreaterThanOrEqual(7);
      expect(count, pillar).toBeLessThanOrEqual(13);
    }
  });

  it("rotates spotlights through every audience segment", () => {
    const spotlighted = new Set(
      plans
        .filter((plan) => plan.pillar === "audienceSpotlights")
        .map((plan) => plan.audience),
    );
    for (const audience of audiences) {
      expect([...spotlighted], "covers all audiences").toContain(audience.slug);
    }
  });

  it("only spotlight slots carry an audience", () => {
    for (const plan of plans) {
      if (plan.pillar === "audienceSpotlights") {
        expect(plan.audience).toBeTruthy();
      } else {
        expect(plan.audience).toBeNull();
      }
    }
  });

  it("is deterministic", () => {
    const again = planCalendar({ from: new Date("2026-07-27T00:00:00Z") });
    expect(again).toEqual(plans);
  });

  it("seeding week-by-week matches seeding the whole window at once", () => {
    // Regression: window-relative rotation restarted the cycles every week,
    // repeating the first audiences and starving pillars.
    const weekly = [0, 7, 14, 21].flatMap((offset) =>
      planCalendar({
        from: new Date(Date.UTC(2026, 6, 27 + offset)),
        days: 7,
      }),
    );
    expect(weekly).toEqual(plans);
  });
});
