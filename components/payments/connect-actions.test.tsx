import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConnectActions } from "@/components/payments/connect-actions";
import { renderWithIntl } from "@/test/i18n-test-utils";

const countryOptions = [
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
];

describe("ConnectActions", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the country picker with translated chrome before an account exists", () => {
    renderWithIntl(
      <ConnectActions
        onboardingLabel="Set up payments with Stripe"
        showDashboardLink={false}
        countryOptions={countryOptions}
      />,
    );

    expect(screen.getByText("Your country")).toBeVisible();
    expect(
      screen.getByText(/fixes your payout currency/i),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Set up payments with Stripe" }),
    ).toBeVisible();
  });

  it("shows the Stripe dashboard button once details are submitted", () => {
    renderWithIntl(
      <ConnectActions onboardingLabel={null} showDashboardLink={true} />,
    );

    expect(
      screen.getByRole("button", { name: /payouts & details on stripe/i }),
    ).toBeVisible();
    expect(screen.queryByText("Your country")).not.toBeInTheDocument();
  });

  it("renders a coded API error in the visitor's language", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ error: { code: "api.connectCountryUnsupported" } }),
        { status: 400 },
      ),
    );
    const user = userEvent.setup();
    renderWithIntl(
      <ConnectActions
        onboardingLabel="Set up payments with Stripe"
        showDashboardLink={false}
        countryOptions={countryOptions}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Set up payments with Stripe" }),
    );

    expect(
      await screen.findByText("That country isn't supported yet."),
    ).toBeVisible();
  });

  it("falls back to the generic message when the request fails outright", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    const user = userEvent.setup();
    renderWithIntl(
      <ConnectActions
        onboardingLabel="Set up payments with Stripe"
        showDashboardLink={false}
        countryOptions={countryOptions}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Set up payments with Stripe" }),
    );

    expect(
      await screen.findByText("Something went wrong. Please try again."),
    ).toBeVisible();
  });
});
