import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { HeaderAuth } from "@/components/header-auth";
import type { SessionState } from "@/components/auth/use-session";

const mockSession = vi.fn<() => SessionState>();

vi.mock("@/components/auth/use-session", () => ({
  useSession: () => mockSession(),
}));

describe("HeaderAuth", () => {
  beforeEach(() => {
    mockSession.mockReset();
  });

  it("shows Log in and Register while signed out", () => {
    mockSession.mockReturnValue({ status: "anon" });
    renderWithIntl(<HeaderAuth />);

    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Register" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /account/i }),
    ).not.toBeInTheDocument();
  });

  it("treats the loading state as signed out", () => {
    mockSession.mockReturnValue({ status: "loading" });
    renderWithIntl(<HeaderAuth />);

    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument();
  });

  it("shows the account menu button when signed in", () => {
    mockSession.mockReturnValue({
      status: "authed",
      username: "caddielive",
      displayName: "Caddie Live",
      avatarUrl: null,
      isAdmin: false,
    });
    renderWithIntl(<HeaderAuth />);

    expect(screen.getByRole("button", { name: /Caddie Live/ })).toHaveAttribute(
      "aria-haspopup",
      "menu",
    );
    expect(screen.queryByRole("link", { name: "Log in" })).not.toBeInTheDocument();
  });
});
