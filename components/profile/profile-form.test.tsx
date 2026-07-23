import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProfileForm } from "@/components/profile/profile-form";

const filledProps = {
  initialUsername: "callum-reid",
  initialDisplayName: "Callum Reid",
  initialBio: "Chasing scratch.",
  initialCountry: "Scotland",
};

const emptyProps = {
  initialUsername: null,
  initialDisplayName: "",
  initialBio: "",
  initialCountry: "",
};

describe("ProfileForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation errors instead of submitting an invalid form", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<ProfileForm {...emptyProps} />);

    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(
      await screen.findByText(/lowercase letters, numbers or hyphens/i),
    ).toBeVisible();
    expect(
      screen.getByText(/name supporters should see/i),
    ).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects reserved usernames client-side", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<ProfileForm {...emptyProps} />);

    await user.type(screen.getByLabelText("Your public link"), "admin");
    await user.type(screen.getByLabelText("Display name"), "Admin Impostor");
    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByText(/reserved/i)).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("warns before saving a username change", async () => {
    const user = userEvent.setup();
    render(<ProfileForm {...filledProps} />);

    const usernameField = screen.getByLabelText("Your public link");
    await user.clear(usernameField);
    await user.type(usernameField, "callum-golf");

    expect(
      screen.getByText(/changes your public link/i),
    ).toBeVisible();
  });

  it("submits a valid profile and shows the copyable public link", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          profile: {
            username: "callum-reid",
            displayName: "Callum Reid",
            bio: "Chasing scratch.",
            country: "Scotland",
          },
        }),
        { status: 200 },
      ),
    );
    const user = userEvent.setup();
    render(<ProfileForm {...filledProps} />);

    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      /profile saved/i,
    );
    expect(
      screen.getByRole("link", { name: /buymeatee\.com\/t\/callum-reid/i }),
    ).toHaveAttribute("href", "/t/callum-reid");
    expect(
      screen.getByRole("button", { name: /copy link/i }),
    ).toBeVisible();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse((init?.body as string) ?? "{}")).toMatchObject({
      username: "callum-reid",
      displayName: "Callum Reid",
    });
  });

  it("surfaces a server-side username conflict on the field", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          errors: { username: "That link is already taken. Pick another." },
        }),
        { status: 409 },
      ),
    );
    const user = userEvent.setup();
    render(<ProfileForm {...filledProps} />);

    await user.click(screen.getByRole("button", { name: "Save profile" }));

    expect(
      await screen.findByText(/already taken/i),
    ).toBeVisible();
  });

  it("counts bio characters live", async () => {
    const user = userEvent.setup();
    render(<ProfileForm {...emptyProps} />);

    await user.type(screen.getByLabelText(/bio/i), "On tour.");

    expect(screen.getByText("8/1000")).toBeVisible();
  });
});
