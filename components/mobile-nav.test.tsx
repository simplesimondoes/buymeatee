import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { MobileNav } from "@/components/mobile-nav";

// The embedded LanguageSwitcher reads Next's router/pathname, which have no
// provider under jsdom — mock the raw next/navigation hooks it relies on.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  usePathname: () => "/en",
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

describe("MobileNav", () => {
  it("opens and closes via the toggle button", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MobileNav />);

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
    renderWithIntl(<MobileNav />);

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("contains all primary navigation links and both actions", async () => {
    const user = userEvent.setup();
    renderWithIntl(<MobileNav />);
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    for (const label of [
      "How it works",
      "For creators",
      "For supporters",
      "Blog",
      "FAQ",
      "Register",
      "Log in",
    ]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });
});
