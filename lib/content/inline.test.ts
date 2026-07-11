import { describe, expect, it } from "vitest";

import { parseInline, stripInline } from "@/lib/content/inline";

describe("parseInline", () => {
  it("returns plain text untouched", () => {
    expect(parseInline("No links here.")).toEqual(["No links here."]);
  });

  it("extracts a single link with surrounding text", () => {
    expect(parseInline("Read [the FAQ](/faq) for more.")).toEqual([
      "Read ",
      { label: "the FAQ", href: "/faq" },
      " for more.",
    ]);
  });

  it("extracts multiple links", () => {
    const segments = parseInline("[A](/a) and [B](/b)");
    expect(segments).toEqual([
      { label: "A", href: "/a" },
      " and ",
      { label: "B", href: "/b" },
    ]);
  });

  it("handles links at the end of the text", () => {
    expect(parseInline("See [how it works](/how-it-works)")).toEqual([
      "See ",
      { label: "how it works", href: "/how-it-works" },
    ]);
  });
});

describe("stripInline", () => {
  it("replaces links with their labels", () => {
    expect(stripInline("Read [the FAQ](/faq) for more.")).toBe(
      "Read the FAQ for more.",
    );
  });
});
