import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { DiscoverBrowser } from "@/components/discover/discover-browser";
import { DiscoverProvider } from "@/components/discover/discover-context";
import type { DiscoverGoalCard } from "@/lib/discover/types";
import { renderWithIntl } from "@/test/i18n-test-utils";

const base: Omit<
  DiscoverGoalCard,
  "key" | "title" | "creatorName" | "isPreview"
> = {
  description: null,
  imageSrc: null,
  imageAlt: "",
  creatorHref: null,
  location: null,
  country: null,
  category: null,
  raisedMinor: 0,
  targetMinor: 100000,
  currency: "gbp",
  percent: 0,
  started: false,
  createdAt: "2026-07-01",
};

const previewGoal: DiscoverGoalCard = {
  ...base,
  key: "preview-goal-caddieLive",
  title: "previewCreators.caddieLive.goalTitle",
  creatorName: "Caddie Live",
  location: "previewCreators.caddieLive.location",
  country: "previewCreators.caddieLive.country",
  category: "golf-apps",
  isPreview: true,
};

const realGoal: DiscoverGoalCard = {
  ...base,
  key: "goal-real-1",
  title: "Play the Irish Amateur",
  creatorName: "Rory McDonald",
  creatorHref: "/t/rory",
  location: "Dublin",
  country: "Ireland",
  isPreview: false,
  createdAt: "2026-07-20",
};

function renderBrowser(goals: DiscoverGoalCard[] = [previewGoal, realGoal]) {
  return renderWithIntl(
    <DiscoverProvider>
      <DiscoverBrowser goals={goals} />
    </DiscoverProvider>,
  );
}

describe("DiscoverBrowser", () => {
  it("shows a localized, pluralized result count", () => {
    renderBrowser();
    expect(screen.getByText("2 journeys")).toBeInTheDocument();
  });

  it("searches Preview cards by their translated text, not their keys", async () => {
    const user = userEvent.setup();
    renderBrowser();

    // "Manchester" only exists as a content-namespace translation of the
    // preview card's location key.
    await user.type(
      screen.getByLabelText("Search creators, projects and goals"),
      "Manchester",
    );

    expect(screen.getByText("1 journey")).toBeInTheDocument();
    expect(screen.getByText("Add 10,000 golf courses")).toBeInTheDocument();
    expect(screen.queryByText("Play the Irish Amateur")).not.toBeInTheDocument();
  });

  it("offers translated country options and filters on them", async () => {
    const user = userEvent.setup();
    renderBrowser();

    const country = screen.getByRole("combobox", { name: "Country" });
    // Preview country keys resolve to display names in the facet.
    expect(
      screen.getByRole("option", { name: "England" }),
    ).toBeInTheDocument();
    await user.selectOptions(country, "Ireland");

    expect(screen.getByText("1 journey")).toBeInTheDocument();
    expect(screen.getByText("Play the Irish Amateur")).toBeInTheDocument();
  });

  it("shows the localized empty state and clears filters", async () => {
    const user = userEvent.setup();
    renderBrowser();

    await user.type(
      screen.getByLabelText("Search creators, projects and goals"),
      "zzz-no-match",
    );
    expect(
      screen.getByText(
        "No journeys match your search yet. Try clearing a filter or a different term.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByText("2 journeys")).toBeInTheDocument();
  });

  it("labels the sort options in the UI language", () => {
    renderBrowser();
    const sort = screen.getByRole("combobox", { name: "Sort" });
    expect(sort).toBeInTheDocument();
    for (const label of [
      "Newest",
      "Most supported",
      "Near completion",
      "Trending",
    ]) {
      expect(screen.getByRole("option", { name: label })).toBeInTheDocument();
    }
  });

  it("pages results with a localized show-more control", async () => {
    const user = userEvent.setup();
    const many = Array.from({ length: 8 }, (_, i) => ({
      ...realGoal,
      key: `goal-${i}`,
      title: `Goal number ${i}`,
    }));
    renderBrowser(many);

    expect(screen.getAllByRole("article")).toHaveLength(6);
    await user.click(
      screen.getByRole("button", { name: "Show more journeys" }),
    );
    expect(screen.getAllByRole("article")).toHaveLength(8);
  });
});
