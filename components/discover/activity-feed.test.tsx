import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ActivityFeed } from "@/components/discover/activity-feed";
import { previewActivityItems } from "@/lib/content/preview-creators";
import { renderWithIntl } from "@/test/i18n-test-utils";

describe("ActivityFeed", () => {
  it("stays honestly labelled as a Concept", () => {
    renderWithIntl(<ActivityFeed />);

    expect(screen.getByText("Concept")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Illustrative activity — no real supporters or gifts are shown.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "The platform, alive with support",
      }),
    ).toBeInTheDocument();
  });

  it("renders every preview activity line from the content namespace", () => {
    renderWithIntl(<ActivityFeed />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(previewActivityItems.length);
    expect(items[0]).toHaveTextContent("Alex bought Sarah Bell a Tee");
    expect(items[1]).toHaveTextContent("Jordan supported Coach Dan's studio");
  });
});
