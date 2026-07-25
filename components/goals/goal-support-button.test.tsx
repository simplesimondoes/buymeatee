import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithIntl } from "@/test/i18n-test-utils";
import { GoalSupportButton } from "@/components/goals/goal-support-button";
import {
  SupportTargetProvider,
  useSupportTarget,
} from "@/components/payments/support-target-context";

function Probe() {
  const { target } = useSupportTarget();
  return (
    <p>
      target: {target ? `${target.kind}:${target.title}` : "none"}
    </p>
  );
}

describe("GoalSupportButton", () => {
  it("selects the goal (with its progress) as the support target", () => {
    renderWithIntl(
      <SupportTargetProvider>
        <GoalSupportButton
          id="g1"
          title="Play every Open venue"
          raised={620}
          target={1000}
        />
        <Probe />
      </SupportTargetProvider>,
    );

    expect(screen.getByText("target: none")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /support this goal/i }));
    expect(
      screen.getByText("target: goal:Play every Open venue"),
    ).toBeVisible();
  });
});
