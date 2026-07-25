import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { OnboardingChecklist } from "@/components/profile/onboarding-checklist";
import type { CreatorSetupState } from "@/lib/profile/setup-state";

function setupState(
  steps: Partial<CreatorSetupState["steps"]>,
): CreatorSetupState {
  return {
    profile: null,
    goals: [],
    account: null,
    paymentState: "not_started",
    profileUnavailable: false,
    goalsUnavailable: false,
    paymentsUnavailable: false,
    steps: {
      claimedLink: false,
      profileComplete: false,
      hasActiveGoal: false,
      paymentsReady: false,
      ...steps,
    },
  };
}

describe("OnboardingChecklist", () => {
  it("lists all four steps with actions for a fresh account", () => {
    renderWithIntl(<OnboardingChecklist state={setupState({})} />);

    expect(screen.getByText("0 of 4 done")).toBeVisible();
    expect(screen.getByRole("link", { name: "Choose a link" })).toHaveAttribute(
      "href",
      "/en/settings/profile",
    );
    expect(screen.getByRole("link", { name: "Add a goal" })).toHaveAttribute(
      "href",
      "/en/dashboard/goals",
    );
    expect(
      screen.getByRole("link", { name: "Set up payments" }),
    ).toHaveAttribute("href", "/en/settings/payments");
  });

  it("marks completed steps and drops their action links", () => {
    renderWithIntl(
      <OnboardingChecklist
        state={setupState({ claimedLink: true, profileComplete: true })}
      />,
    );

    expect(screen.getByText("2 of 4 done")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Choose a link" })).toBeNull();
    expect(
      screen.getByText(
        (_, element) =>
          element?.tagName === "P" &&
          /Claim your link\s*— done/.test(element.textContent ?? ""),
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Add a goal" })).toBeVisible();
  });

  it("disappears entirely once every step is done", () => {
    const { container } = renderWithIntl(
      <OnboardingChecklist
        state={setupState({
          claimedLink: true,
          profileComplete: true,
          hasActiveGoal: true,
          paymentsReady: true,
        })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
