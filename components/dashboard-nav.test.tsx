import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { DashboardNav } from "@/components/dashboard-nav";

// The nav derives the active tab from the locale-stripped pathname
// (@/i18n/navigation), which reads Next's raw, locale-prefixed pathname.
const mockPathname = vi.fn<() => string>();

vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => mockPathname(),
}));

describe("DashboardNav", () => {
  beforeEach(() => {
    mockPathname.mockReset();
  });

  it("links to every dashboard section", () => {
    mockPathname.mockReturnValue("/en/dashboard");
    renderWithIntl(<DashboardNav />);

    for (const [label, href] of [
      ["Overview", "/en/dashboard"],
      ["Goals", "/en/dashboard/goals"],
      ["Updates", "/en/dashboard/updates"],
      ["Payments", "/en/dashboard/payments"],
      ["Profile", "/en/settings/profile"],
    ] as const) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("marks Overview current only on the exact overview path", () => {
    mockPathname.mockReturnValue("/en/dashboard/goals");
    renderWithIntl(<DashboardNav />);

    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks Overview current on the overview path itself", () => {
    mockPathname.mockReturnValue("/en/dashboard");
    renderWithIntl(<DashboardNav />);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("highlights the active tab on a non-English locale prefix", () => {
    mockPathname.mockReturnValue("/de/dashboard/payments");
    renderWithIntl(<DashboardNav />, { locale: "de" });

    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
