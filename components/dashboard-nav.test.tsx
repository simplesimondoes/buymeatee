import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardNav } from "@/components/dashboard-nav";

const mockPathname = vi.fn<() => string>();

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}));

describe("DashboardNav", () => {
  beforeEach(() => {
    mockPathname.mockReset();
  });

  it("links to every dashboard section", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<DashboardNav />);

    for (const [label, href] of [
      ["Overview", "/dashboard"],
      ["Goals", "/dashboard/goals"],
      ["Updates", "/dashboard/updates"],
      ["Payments", "/dashboard/payments"],
      ["Profile", "/settings/profile"],
    ] as const) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute(
        "href",
        href,
      );
    }
  });

  it("marks Overview current only on the exact overview path", () => {
    mockPathname.mockReturnValue("/dashboard/goals");
    render(<DashboardNav />);

    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute(
      "aria-current",
    );
    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("marks Overview current on the overview path itself", () => {
    mockPathname.mockReturnValue("/dashboard");
    render(<DashboardNav />);

    expect(screen.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });
});
