import { describe, expect, it } from "vitest";

import { clientKeyFromHeaders, isRateLimited } from "@/lib/rate-limit";

describe("isRateLimited", () => {
  it("allows up to the limit within the window, then blocks", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i += 1) {
      expect(isRateLimited(key, 5, 60_000)).toBe(false);
    }
    expect(isRateLimited(key, 5, 60_000)).toBe(true);
  });

  it("tracks keys independently", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(isRateLimited(a, 1, 60_000)).toBe(false);
    expect(isRateLimited(a, 1, 60_000)).toBe(true);
    expect(isRateLimited(b, 1, 60_000)).toBe(false);
  });
});

describe("clientKeyFromHeaders", () => {
  it("uses the first forwarded IP", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" });
    expect(clientKeyFromHeaders(headers)).toBe("203.0.113.9");
  });

  it("falls back to unknown", () => {
    expect(clientKeyFromHeaders(new Headers())).toBe("unknown");
  });
});
