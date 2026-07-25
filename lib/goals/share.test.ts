import { describe, expect, it } from "vitest";

import giftsMessages from "@/messages/en/gifts.json";
import {
  completedGoalShareText,
  GOAL_MILESTONES,
  goalShareText,
  pageLiveShareText,
  pageShareText,
  reachedMilestone,
  supporterShareText,
  supportShareText,
  trimShareTitle,
  updateShareText,
  wishlistFundedShareText,
  type ShareMessage,
} from "@/lib/goals/share";

// The share block also holds the nested `moment` UI labels; message keys are
// the flat string entries.
const shareMessages = giftsMessages.share as unknown as Record<string, string>;

/** Render a ShareMessage against the English catalog the way the UI does. */
function renderShare(message: ShareMessage): string {
  const template = shareMessages[message.key];
  expect(template, `missing share message: ${message.key}`).toBeTypeOf("string");
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = message.params?.[name as "title" | "percent" | "name"];
    return value === undefined ? match : String(value);
  });
}

describe("reachedMilestone", () => {
  it("is null below the first threshold", () => {
    expect(reachedMilestone(0, 1000)).toBeNull();
    expect(reachedMilestone(249, 1000)).toBeNull();
  });

  it("returns the highest crossed threshold", () => {
    expect(reachedMilestone(250, 1000)).toBe(25);
    expect(reachedMilestone(500, 1000)).toBe(50);
    expect(reachedMilestone(749, 1000)).toBe(50);
    expect(reachedMilestone(750, 1000)).toBe(75);
  });

  it("only reaches 100 when the target is actually met", () => {
    expect(reachedMilestone(999, 1000)).toBe(75);
    expect(reachedMilestone(1000, 1000)).toBe(100);
    // Over-target still caps at 100 (honest percent is capped).
    expect(reachedMilestone(5000, 1000)).toBe(100);
  });

  it("handles a zero or invalid target safely", () => {
    expect(reachedMilestone(500, 0)).toBeNull();
  });
});

describe("pageShareText", () => {
  it("selects on-brand, X-length-safe page copy", () => {
    const text = renderShare(pageShareText());
    expect(text).toContain("BuyMeATee");
    expect(text).toContain("journey");
    // Leaves room for the appended URL within X's 280-char limit.
    expect(text.length).toBeLessThanOrEqual(200);
  });
});

describe("goalShareText", () => {
  it("celebrates a funded goal", () => {
    const message = goalShareText("Q-School entry fee", 42500, 42500);
    expect(message.key).toBe("goalFunded");
    const text = renderShare(message);
    expect(text).toContain("funded");
    expect(text).toContain("Q-School entry fee");
  });

  it("reports honest progress at an in-progress milestone", () => {
    const message = goalShareText("Scotland links trip", 500, 1000);
    expect(message.key).toBe("goalMilestone");
    expect(message.params?.percent).toBe(50);
    const text = renderShare(message);
    expect(text).toContain("50%");
    expect(text).toContain("Scotland links trip");
  });

  it("invites the first backers before any milestone", () => {
    const message = goalShareText("New clubs", 0, 1000);
    expect(message.key).toBe("goalStarting");
    // No fabricated progress figure when there is none.
    expect(message.params?.percent).toBeUndefined();
    const text = renderShare(message);
    expect(text).toContain("New clubs");
    expect(text).toContain("Support the journey");
    expect(text).not.toMatch(/\d+%/);
  });

  it("truncates an over-long title", () => {
    const longTitle = "A".repeat(120);
    const message = goalShareText(longTitle, 500, 1000);
    expect(message.params?.title).toContain("…");
    expect(message.params?.title).not.toContain("A".repeat(120));
  });

  it("keeps the goal title verbatim within the length limit", () => {
    // User content must be quoted, never rewritten.
    expect(trimShareTitle("Play the Old Course")).toBe("Play the Old Course");
  });

  it("never uses off-brand fundraising vocabulary", () => {
    const samples = [
      renderShare(pageShareText()),
      renderShare(goalShareText("Goal", 0, 1000)),
      renderShare(goalShareText("Goal", 500, 1000)),
      renderShare(goalShareText("Goal", 1000, 1000)),
      renderShare(completedGoalShareText("Goal")),
    ];
    for (const text of samples) {
      expect(text.toLowerCase()).not.toContain("donat");
      expect(text.toLowerCase()).not.toContain("crowdfund");
    }
  });
});

describe("completedGoalShareText", () => {
  it("celebrates completion without asserting a funding level", () => {
    const message = completedGoalShareText("Regional qualifier travel");
    expect(message.key).toBe("goalCompleted");
    const text = renderShare(message);
    expect(text).toContain("Regional qualifier travel");
    expect(text).toContain("reached");
    expect(text).not.toMatch(/\d+%/);
    expect(text).not.toContain("funded");
  });
});

describe("supportShareText", () => {
  it("celebrates a Tee toward a goal and links back to the goal", () => {
    const message = supportShareText({ label: "Scotland links trip", toward: true });
    expect(message.key).toBe("supportGoal");
    const text = renderShare(message);
    expect(text).toContain("Scotland links trip");
    expect(text).toContain("BuyMeATee");
    expect(text).toContain("Support the journey");
  });

  it("celebrates a funded wish-list item", () => {
    const message = supportShareText({ label: "New rangefinder", toward: false });
    expect(message.key).toBe("supportWishlist");
    const text = renderShare(message);
    expect(text).toContain("New rangefinder");
    expect(text).toContain("wish list");
  });

  it("has an honest fallback for general support", () => {
    const message = supportShareText(null);
    expect(message.key).toBe("supportGeneral");
    const text = renderShare(message);
    expect(text).toContain("BuyMeATee");
    expect(text).toContain("journey");
  });

  it("never invents amounts, counts or a supporter name", () => {
    const samples = [
      renderShare(supportShareText({ label: "Goal", toward: true })),
      renderShare(supportShareText({ label: "Item", toward: false })),
      renderShare(supportShareText(null)),
    ];
    for (const text of samples) {
      expect(text.toLowerCase()).not.toContain("donat");
      expect(text.toLowerCase()).not.toContain("crowdfund");
      // No fabricated figures.
      expect(text).not.toMatch(/\d/);
      expect(text).not.toMatch(/[£$€]/);
    }
  });

  it("truncates an over-long target title", () => {
    const message = supportShareText({ label: "A".repeat(120), toward: true });
    expect(message.params?.title).toContain("…");
    expect(message.params?.title).not.toContain("A".repeat(120));
  });
});

describe("pageLiveShareText", () => {
  it("celebrates the launch on-brand and X-length-safe", () => {
    const message = pageLiveShareText();
    expect(message.key).toBe("pageLive");
    const text = renderShare(message);
    expect(text).toContain("BuyMeATee");
    expect(text).toContain("live");
    expect(text.length).toBeLessThanOrEqual(200);
  });
});

describe("updateShareText", () => {
  it("quotes the update title verbatim", () => {
    const message = updateShareText("Broke 80 at the county open");
    expect(message.key).toBe("updatePublished");
    const text = renderShare(message);
    expect(text).toContain("Broke 80 at the county open");
    expect(text).toContain("BuyMeATee");
  });

  it("truncates an over-long title", () => {
    const message = updateShareText("A".repeat(120));
    expect(message.params?.title).toContain("…");
  });
});

describe("wishlistFundedShareText", () => {
  it("celebrates the funded item with thanks, no invented figures", () => {
    const message = wishlistFundedShareText("A dozen tour balls");
    expect(message.key).toBe("wishlistFunded");
    const text = renderShare(message);
    expect(text).toContain("A dozen tour balls");
    expect(text.toLowerCase()).toContain("thank");
    expect(text).not.toMatch(/\d/);
    expect(text).not.toMatch(/[£$€]/);
  });
});

describe("supporterShareText", () => {
  it("speaks in the supporter's first person about a goal", () => {
    const message = supporterShareText("Alex Fairway", {
      kind: "goal",
      title: "Q-School entry fee",
    });
    expect(message.key).toBe("supporterGoal");
    const text = renderShare(message);
    expect(text).toContain("Alex Fairway");
    expect(text).toContain("Q-School entry fee");
    expect(text).toContain("I've");
  });

  it("covers wish-list items and general support", () => {
    const item = supporterShareText("Alex", { kind: "wishlist", title: "Balls" });
    expect(item.key).toBe("supporterWishlist");
    const general = supporterShareText("Alex", null);
    expect(general.key).toBe("supporterGeneral");
    expect(renderShare(general)).toContain("Alex");
  });

  it("never reveals amounts or off-brand vocabulary", () => {
    const samples = [
      renderShare(supporterShareText("Alex", { kind: "goal", title: "Goal" })),
      renderShare(supporterShareText("Alex", { kind: "wishlist", title: "Item" })),
      renderShare(supporterShareText("Alex", null)),
    ];
    for (const text of samples) {
      expect(text.toLowerCase()).not.toContain("donat");
      expect(text.toLowerCase()).not.toContain("crowdfund");
      expect(text).not.toMatch(/\d/);
      expect(text).not.toMatch(/[£$€]/);
    }
  });

  it("truncates over-long names and titles", () => {
    const message = supporterShareText("N".repeat(120), {
      kind: "goal",
      title: "T".repeat(120),
    });
    expect(message.params?.name).toContain("…");
    expect(message.params?.title).toContain("…");
  });
});

describe("GOAL_MILESTONES", () => {
  it("is the expected ascending set", () => {
    expect([...GOAL_MILESTONES]).toEqual([25, 50, 75, 100]);
  });
});
