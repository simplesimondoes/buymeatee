import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SupportHero } from "@/components/profile/support-hero";
import type { CreatorGoalRow } from "@/lib/goals/types";

function makeGoal(overrides: Partial<CreatorGoalRow> = {}): CreatorGoalRow {
  return {
    id: "g1",
    creator_id: "c1",
    title: "Play every Open venue",
    description: null,
    cover_image_url: null,
    currency: "gbp",
    target_amount: 100_000,
    raised_amount: 62_000,
    status: "active",
    sort_order: 0,
    taken_down_at: null,
    created_at: "2026-07-01T00:00:00Z",
    updated_at: "2026-07-01T00:00:00Z",
    ...overrides,
  };
}

describe("SupportHero", () => {
  it("shows the goal's real progress and the CTA when the creator is ready", () => {
    render(<SupportHero name="James" goal={makeGoal()} ready />);

    expect(screen.getByText("Current goal")).toBeInTheDocument();
    expect(screen.getByText("Play every Open venue")).toBeInTheDocument();
    expect(screen.getByText("£620.00 of £1000.00")).toBeInTheDocument();
    expect(screen.getByText("62%")).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: "Buy James a Tee" });
    expect(cta).toHaveAttribute("href", "#support");
    expect(cta).toHaveAttribute("id", "support-cta-inline"); // sticky-bar sentinel
  });

  it("shows goal progress but no CTA when the creator can't receive Tees", () => {
    render(<SupportHero name="James" goal={makeGoal()} ready={false} />);

    expect(screen.getByText("Play every Open venue")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Buy James a Tee/ })).not.toBeInTheDocument();
  });

  it("invites the first backer on a goal with no Tees yet", () => {
    render(<SupportHero name="James" goal={makeGoal({ raised_amount: 0 })} ready />);

    expect(screen.getByText("£1000.00 goal")).toBeInTheDocument();
    expect(screen.getByText("Be the first")).toBeInTheDocument();
  });

  it("falls back to a plain CTA when ready with no active goal", () => {
    render(<SupportHero name="James" goal={null} ready />);

    expect(screen.queryByText("Current goal")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Buy James a Tee" })).toHaveAttribute(
      "id",
      "support-cta-inline",
    );
  });

  it("renders nothing when there's no goal and the creator isn't ready", () => {
    const { container } = render(
      <SupportHero name="James" goal={null} ready={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
