import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CountrySelect } from "@/components/payments/country-select";

const OPTIONS = [
  { code: "GB", label: "United Kingdom", flag: "🇬🇧" },
  { code: "US", label: "United States", flag: "🇺🇸" },
  { code: "DE", label: "Germany", flag: "🇩🇪" },
];

/** Controlled wrapper so selection reflects back into the trigger. */
function Harness({
  initial = "GB",
  onChange,
}: {
  initial?: string;
  onChange?: (code: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <CountrySelect
      label="Your country"
      value={value}
      onChange={(code) => {
        setValue(code);
        onChange?.(code);
      }}
      options={OPTIONS}
    />
  );
}

describe("CountrySelect", () => {
  it("is collapsed by default and shows the selected country", () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: /United Kingdom/ });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens the listbox and lists every option", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole("button", { name: /United Kingdom/ }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(3);
    expect(
      screen.getByRole("option", { name: "United Kingdom" }),
    ).toHaveAttribute("aria-selected", "true");
  });

  it("selects an option on click, updating the trigger and closing", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /United Kingdom/ }));
    await user.click(screen.getByRole("option", { name: "United States" }));

    expect(onChange).toHaveBeenCalledWith("US");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /United States/ }),
    ).toBeInTheDocument();
  });

  it("supports arrow-key navigation then Enter to select", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Harness onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: /United Kingdom/ }));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onChange).toHaveBeenCalledWith("US");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape and restores focus to the trigger", async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: /United Kingdom/ });

    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
