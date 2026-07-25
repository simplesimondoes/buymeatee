import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CreatorCardView } from "@/components/discover/creator-card-view";
import type { DiscoverCreatorCard } from "@/lib/discover/types";
import { renderWithIntl } from "@/test/i18n-test-utils";

const previewCreator: DiscoverCreatorCard = {
  key: "preview-creator-coachDan",
  name: "Coach Dan",
  href: null,
  avatarUrl: null,
  imageSrc: "/images/putter-and-ball.png",
  imageAlt: "imageAlt.putterAndBall",
  bio: "previewCreators.coachDan.bio",
  location: "previewCreators.coachDan.location",
  country: "previewCreators.coachDan.country",
  category: "golf-coaches",
  currentGoal: {
    title: "previewCreators.coachDan.goalTitle",
    percent: 95,
    started: true,
  },
  updateNote: "previewCreators.coachDan.updateNote",
  isPreview: true,
  createdAt: "2026-07-16",
};

const realCreator: DiscoverCreatorCard = {
  key: "creator-123",
  name: "Sibe",
  href: "/t/sibe",
  avatarUrl: null,
  imageSrc: null,
  imageAlt: "",
  bio: "Chasing scratch, one range session at a time.",
  location: "Leipzig",
  country: "Germany",
  category: null,
  currentGoal: { title: "Winter league entries", percent: 10, started: true },
  updateNote: null,
  isPreview: false,
  createdAt: "2026-07-24",
};

describe("CreatorCardView", () => {
  it("resolves Preview message keys through the content namespace", () => {
    renderWithIntl(<CreatorCardView creator={previewCreator} />);

    expect(screen.getByText("Coach Dan")).toBeInTheDocument();
    expect(screen.getByText("Bristol")).toBeInTheDocument();
    expect(screen.getByText("Golf Coaches")).toBeInTheDocument();
    expect(
      screen.getByText(
        "PGA coach building a home for year-round, all-weather practice.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Posted: the studio lease is signed."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Build an indoor coaching studio"),
    ).toBeInTheDocument();
    expect(screen.getByText("95%")).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /See how it works/ }),
    ).toBeInTheDocument();
  });

  it("renders real creators verbatim with a Support link", () => {
    renderWithIntl(<CreatorCardView creator={realCreator} />);

    expect(screen.getByText("Sibe")).toBeInTheDocument();
    expect(screen.getByText("Leipzig")).toBeInTheDocument();
    expect(
      screen.getByText("Chasing scratch, one range session at a time."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Preview")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Support" })).toHaveAttribute(
      "href",
      "/en/t/sibe",
    );
  });
});
