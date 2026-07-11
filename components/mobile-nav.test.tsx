import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { MobileNav } from "@/components/mobile-nav";

describe("MobileNav", () => {
  it("opens and closes via the toggle button", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(
      screen.getByRole("dialog", { name: "Site navigation" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "How it works" }),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // Focus returns to the toggle after closing.
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("contains all primary navigation links and both actions", async () => {
    const user = userEvent.setup();
    render(<MobileNav />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    for (const label of [
      "How it works",
      "For creators",
      "For supporters",
      "Blog",
      "FAQ",
      "Start your page",
      "Join early access",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
