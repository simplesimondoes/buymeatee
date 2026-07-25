import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { PublicGoals } from "@/components/goals/public-goals";
import type { CreatorGoalRow } from "@/lib/goals/types";

function goal(overrides: Partial<CreatorGoalRow> = {}): CreatorGoalRow {
  return {
    id: "goal-1",
    creator_id: "user-1",
    title: "Scotland links trip",
    description: "Green fees and travel.",
    cover_image_url: null,
    currency: "gbp",
    target_amount: 100_000,
    raised_amount: 0,
    status: "active",
    sort_order: 0,
    taken_down_at: null,
    created_at: "2026-07-12T00:00:00Z",
    updated_at: "2026-07-12T00:00:00Z",
    ...overrides,
  };
}

const noop = {
  creatorName: "Callum",
  isOwner: false,
  ready: false,
  currency: "gbp" as const,
};

describe("PublicGoals", () => {
  it("renders nothing for visitors when there are no goals", () => {
    const { container } = renderWithIntl(
      <PublicGoals active={[]} completed={[]} {...noop} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the owner a setup CTA when there are no goals", () => {
    renderWithIntl(
      <PublicGoals
        active={[]}
        completed={[]}
        creatorName="Callum"
        isOwner
        ready={false}
        currency="gbp"
      />,
    );
    expect(
      screen.getByRole("link", { name: /add your first goal/i }),
    ).toHaveAttribute("href", "/en/dashboard/goals");
  });

  it("is honest about a zero-raised goal — no fake progress", () => {
    renderWithIntl(<PublicGoals active={[goal()]} completed={[]} {...noop} />);

    expect(screen.getByText(/£1,000\.00 goal/)).toBeVisible();
    expect(screen.getByText(/just getting started/i)).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });

  it("shows partial progress with an accessible text equivalent", () => {
    renderWithIntl(
      <PublicGoals
        active={[goal({ raised_amount: 54_000 })]}
        completed={[]}
        {...noop}
      />,
    );

    expect(screen.getByText(/£540\.00 of £1,000\.00/)).toBeVisible();
    expect(screen.getByText(/^54%$/)).toBeVisible();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "54");
    expect(bar).toHaveAccessibleName(
      expect.stringContaining("£540.00 of £1,000.00"),
    );
  });

  it("caps the bar at 100 but shows the real over-target total", () => {
    renderWithIntl(
      <PublicGoals
        active={[goal({ raised_amount: 130_000 })]}
        completed={[]}
        {...noop}
      />,
    );

    expect(screen.getByText(/£1,300\.00 of £1,000\.00/)).toBeVisible();
    expect(screen.getByText(/beyond the goal/i)).toBeVisible();
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );
  });

  it("lists completed goals as journey proof", () => {
    renderWithIntl(
      <PublicGoals
        active={[]}
        completed={[
          goal({ id: "done-1", status: "completed", raised_amount: 100_000 }),
        ]}
        {...noop}
      />,
    );

    expect(screen.getByText(/made possible by supporters/i)).toBeVisible();
    expect(screen.getByText(/£1,000\.00 raised/)).toBeVisible();
  });
});
