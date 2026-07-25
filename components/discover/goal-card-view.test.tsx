import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GoalCardView } from "@/components/discover/goal-card-view";
import type { DiscoverGoalCard } from "@/lib/discover/types";
import { renderWithIntl } from "@/test/i18n-test-utils";

const previewGoal: DiscoverGoalCard = {
  key: "preview-goal-caddieLive",
  title: "previewCreators.caddieLive.goalTitle",
  description: "previewCreators.caddieLive.goalDescription",
  imageSrc: "/images/creator-vlogging-golf.png",
  imageAlt: "imageAlt.creatorVloggingGolf",
  creatorName: "Caddie Live",
  creatorHref: null,
  location: "previewCreators.caddieLive.location",
  country: "previewCreators.caddieLive.country",
  category: "golf-apps",
  raisedMinor: 840000,
  targetMinor: 1000000,
  currency: "gbp",
  percent: 84,
  started: true,
  isPreview: true,
  createdAt: "2026-07-20",
};

const realGoal: DiscoverGoalCard = {
  key: "goal-abc",
  title: "Play the west coast qualifiers",
  description: "Every entry fee for the season.",
  imageSrc: null,
  imageAlt: "",
  creatorName: "Rory McDonald",
  creatorHref: "/t/rory",
  location: "Dublin",
  country: "Ireland",
  category: null,
  raisedMinor: 0,
  targetMinor: 50000,
  currency: "eur",
  percent: 0,
  started: false,
  isPreview: false,
  createdAt: "2026-07-24",
};

describe("GoalCardView", () => {
  it("resolves Preview message keys through the content namespace", () => {
    renderWithIntl(<GoalCardView goal={previewGoal} />);

    expect(screen.getByText("Add 10,000 golf courses")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Mapping and verifying ten thousand courses so every round is covered.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/Manchester/)).toBeInTheDocument();
    expect(screen.getByText("Golf Apps")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    // Preview cards link to how-it-works instead of a creator page.
    expect(
      screen.getByRole("link", { name: /See how goals work/ }),
    ).toBeInTheDocument();
  });

  it("formats amounts and percent for the locale", () => {
    renderWithIntl(<GoalCardView goal={previewGoal} />);

    expect(screen.getByText("£8,400.00 of £10,000.00")).toBeInTheDocument();
    expect(screen.getByText("84%")).toBeInTheDocument();
    expect(
      screen.getByRole("progressbar", {
        name: "Progress towards Add 10,000 golf courses: £8,400.00 of £10,000.00",
      }),
    ).toBeInTheDocument();
  });

  it("renders real goals verbatim — user content is never translated", () => {
    renderWithIntl(<GoalCardView goal={realGoal} />);

    expect(
      screen.getByText("Play the west coast qualifiers"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Rory McDonald/)).toBeInTheDocument();
    expect(screen.getByText(/Dublin/)).toBeInTheDocument();
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    // Not-yet-started goal shows the target and invites the first supporter.
    expect(screen.getByText("€500.00 goal")).toBeInTheDocument();
    expect(screen.getByText("Be the first")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Support" })).toHaveAttribute(
      "href",
      "/en/t/rory",
    );
  });

  it("falls back to a localized creator name when the profile has none", () => {
    renderWithIntl(
      <GoalCardView goal={{ ...realGoal, creatorName: "" }} />,
    );
    expect(screen.getByText(/A creator/)).toBeInTheDocument();
  });
});
