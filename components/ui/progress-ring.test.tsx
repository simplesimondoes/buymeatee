import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressRing } from "@/components/ui/progress-ring";

describe("ProgressRing", () => {
  it("exposes an accessible progressbar with the clamped value", () => {
    render(<ProgressRing value={150} label="Progress towards Q School" />);
    const bar = screen.getByRole("progressbar", {
      name: "Progress towards Q School",
    });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("shows the whole percent by default and hides it when children is null", () => {
    const { rerender } = render(
      <ProgressRing value={42} label="p" />,
    );
    expect(screen.getByText("42%")).toBeInTheDocument();
    rerender(<ProgressRing value={42} label="p">{null}</ProgressRing>);
    expect(screen.queryByText("42%")).not.toBeInTheDocument();
  });
});
