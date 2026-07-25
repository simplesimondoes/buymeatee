import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { AccountMenu } from "@/components/account-menu";

const authed = {
  username: "caddielive",
  displayName: "Caddie Live",
  avatarUrl: null,
};

describe("AccountMenu", () => {
  it("is collapsed by default and reveals actions on click", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AccountMenu {...authed} />);

    const trigger = screen.getByRole("button", { name: /Caddie Live/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    expect(screen.getByRole("menuitem", { name: "My page" })).toHaveAttribute(
      "href",
      "/en/t/caddielive",
    );
    expect(
      screen.getByRole("menuitem", { name: "Dashboard" }),
    ).toHaveAttribute("href", "/en/dashboard");
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/en/settings/profile",
    );
    expect(
      screen.getByRole("menuitem", { name: "Log out" }),
    ).toBeInTheDocument();
  });

  it("logs out via a POST to the sign-out route", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AccountMenu {...authed} />);
    await user.click(screen.getByRole("button", { name: /Caddie Live/ }));

    const form = screen
      .getByRole("menuitem", { name: "Log out" })
      .closest("form");
    expect(form).toHaveAttribute("action", "/auth/sign-out");
    expect(form?.getAttribute("method")).toMatch(/post/i);
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    renderWithIntl(<AccountMenu {...authed} />);
    const trigger = screen.getByRole("button", { name: /Caddie Live/ });

    await user.click(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("hides My page until a username is claimed", async () => {
    const user = userEvent.setup();
    renderWithIntl(
      <AccountMenu username={null} displayName="Caddie Live" avatarUrl={null} />,
    );
    await user.click(screen.getByRole("button", { name: /Caddie Live/ }));

    expect(
      screen.queryByRole("menuitem", { name: "My page" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("menuitem", { name: "Dashboard" }),
    ).toBeInTheDocument();
  });

  it("shows the Admin shortcut only for admins", async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithIntl(<AccountMenu {...authed} />);
    await user.click(screen.getByRole("button", { name: /Caddie Live/ }));
    expect(
      screen.queryByRole("menuitem", { name: "Admin" }),
    ).not.toBeInTheDocument();
    unmount();

    renderWithIntl(<AccountMenu {...authed} isAdmin />);
    await user.click(screen.getByRole("button", { name: /Caddie Live/ }));
    expect(screen.getByRole("menuitem", { name: "Admin" })).toHaveAttribute(
      "href",
      "/en/admin/payments",
    );
  });
});
