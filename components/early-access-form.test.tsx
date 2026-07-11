import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EarlyAccessForm } from "@/components/early-access-form";

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Name"), "Alex Example");
  await user.type(screen.getByLabelText("Email"), "alex@example.com");
  await user.type(screen.getByLabelText("Country"), "United Kingdom");
  await user.click(screen.getByRole("checkbox"));
}

describe("EarlyAccessForm", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation errors instead of submitting an empty form", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    const user = userEvent.setup();
    render(<EarlyAccessForm />);

    await user.click(screen.getByRole("button", { name: "Join early access" }));

    expect(await screen.findByText("Please tell us your name.")).toBeVisible();
    expect(screen.getByText("Please enter your email address.")).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a valid form and shows the success state", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ status: "submitted" }), { status: 200 }),
      );
    const user = userEvent.setup();
    render(<EarlyAccessForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Join early access" }));

    expect(await screen.findByText("You're on the list.")).toBeVisible();
    expect(fetchMock).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(payload).toMatchObject({
      role: "creator",
      name: "Alex Example",
      email: "alex@example.com",
      country: "United Kingdom",
      consent: true,
    });
  });

  it("shows the honest not-connected message on 503", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "not-configured" }), {
        status: 503,
      }),
    );
    const user = userEvent.setup();
    render(<EarlyAccessForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Join early access" }));

    expect(
      await screen.findByText(/sign-up service isn't connected yet/i),
    ).toBeVisible();
    // No fake success.
    expect(screen.queryByText("You're on the list.")).not.toBeInTheDocument();
  });

  it("shows an error state when the request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network"));
    const user = userEvent.setup();
    render(<EarlyAccessForm />);

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Join early access" }));

    expect(
      await screen.findByText(/something went wrong on our side/i),
    ).toBeVisible();
  });

  it("lets the user switch role to supporter", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ status: "submitted" }), { status: 200 }),
    );
    const user = userEvent.setup();
    render(<EarlyAccessForm />);

    await user.click(screen.getByRole("radio", { name: /i'm a supporter/i }));
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Join early access" }));

    await screen.findByText("You're on the list.");
    const payload = JSON.parse(
      String(vi.mocked(globalThis.fetch).mock.calls[0][1]?.body),
    );
    expect(payload.role).toBe("supporter");
  });
});
