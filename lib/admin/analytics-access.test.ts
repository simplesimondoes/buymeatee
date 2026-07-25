import { afterEach, describe, expect, it } from "vitest";

import { canViewAnalytics } from "@/lib/admin/analytics-access";

describe("canViewAnalytics", () => {
  afterEach(() => {
    delete process.env.ANALYTICS_OWNER_EMAILS;
  });

  it("allows the founder's email, case- and whitespace-insensitively", () => {
    expect(canViewAnalytics("simon@chipputtputt.com")).toBe(true);
    expect(canViewAnalytics("  Simon@ChipPuttPutt.com ")).toBe(true);
  });

  it("rejects every other email and missing emails", () => {
    expect(canViewAnalytics("simon.berriman@spreadgroup.com")).toBe(false);
    expect(canViewAnalytics("someone@example.com")).toBe(false);
    expect(canViewAnalytics(null)).toBe(false);
    expect(canViewAnalytics(undefined)).toBe(false);
    expect(canViewAnalytics("")).toBe(false);
  });

  it("honours the ANALYTICS_OWNER_EMAILS env override", () => {
    process.env.ANALYTICS_OWNER_EMAILS = "owner@example.com, Other@Example.org";
    expect(canViewAnalytics("owner@example.com")).toBe(true);
    expect(canViewAnalytics("other@example.org")).toBe(true);
    // The default no longer applies once the override is set.
    expect(canViewAnalytics("simon@chipputtputt.com")).toBe(false);
  });
});
