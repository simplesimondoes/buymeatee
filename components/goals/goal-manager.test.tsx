import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GoalManager } from "@/components/goals/goal-manager";
import type { CreatorGoalRow } from "@/lib/goals/types";

function goal(overrides: Partial<CreatorGoalRow> = {}): CreatorGoalRow {
  return {
    id: "goal-1",
    creator_id: "user-1",
    title: "Scotland links trip",
    description: "Green fees and travel.",
    currency: "gbp",
    target_amount: 100_000,
    raised_amount: 0,
    status: "draft",
    sort_order: 0,
    taken_down_at: null,
    created_at: "2026-07-12T00:00:00Z",
    updated_at: "2026-07-12T00:00:00Z",
    ...overrides,
  };
}

describe("GoalManager", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("teaches with a labelled example in the empty state", () => {
    render(<GoalManager initialGoals={[]} />);

    expect(
      screen.getByText(/what's your journey working towards\?/i),
    ).toBeVisible();
    expect(screen.getByText(/\(Example\)/)).toBeVisible();
    expect(screen.getByText(/0 of 3 active goals/i)).toBeVisible();
  });

  it("creates a goal and shows it as a draft", async () => {
    const created = goal({ id: "goal-new", title: "Q-School entry" });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ goal: created }), { status: 201 }),
    );
    const user = userEvent.setup();
    render(<GoalManager initialGoals={[]} />);

    await user.click(
      screen.getByRole("button", { name: /add your first goal/i }),
    );
    await user.type(
      screen.getByLabelText(/what are you working towards/i),
      "Q-School entry",
    );
    await user.type(screen.getByLabelText("Target"), "425");
    await user.click(screen.getByRole("button", { name: "Save goal" }));

    expect(
      await screen.findByRole("heading", { name: "Q-School entry" }),
    ).toBeVisible();
    expect(screen.getByText("Draft")).toBeVisible();
    expect(screen.getByText(/£0\.00 of £1,?000\.00|£0\.00 of £1000\.00/)).toBeVisible();
  });

  it("shows honest amounts and the publish action for a draft", () => {
    render(<GoalManager initialGoals={[goal()]} />);

    expect(screen.getByText(/£0\.00 of £1000\.00/)).toBeVisible();
    expect(
      screen.getByRole("button", { name: /publish to your page/i }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Delete" })).toBeVisible();
  });

  it("surfaces the server's active-limit refusal", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error:
            "You can have up to 3 active goals. Complete or archive one first.",
        }),
        { status: 409 },
      ),
    );
    const user = userEvent.setup();
    render(<GoalManager initialGoals={[goal()]} />);

    await user.click(
      screen.getByRole("button", { name: /publish to your page/i }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /up to 3 active goals/i,
    );
  });

  it("never offers delete for a goal with attributed support", () => {
    render(
      <GoalManager
        initialGoals={[goal({ status: "active", raised_amount: 12_000 })]}
      />,
    );

    expect(screen.getByText(/£120\.00 of £1000\.00/)).toBeVisible();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    expect(
      screen.getByRole("button", { name: /mark completed/i }),
    ).toBeVisible();
  });
});
