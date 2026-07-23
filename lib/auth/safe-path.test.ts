import { describe, expect, it } from "vitest";

import { safeRelativePath } from "@/lib/auth/safe-path";

describe("safeRelativePath", () => {
  it("allows same-site relative paths", () => {
    expect(safeRelativePath("/dashboard/payments")).toBe("/dashboard/payments");
    expect(safeRelativePath("/t/sam?x=1")).toBe("/t/sam?x=1");
  });

  it("rejects open-redirect attempts", () => {
    expect(safeRelativePath("https://evil.example")).toBe("/dashboard");
    expect(safeRelativePath("//evil.example")).toBe("/dashboard");
    expect(safeRelativePath("/\\evil.example")).toBe("/dashboard");
    expect(safeRelativePath("/x\nSet-Cookie: a=b")).toBe("/dashboard");
    expect(safeRelativePath(null)).toBe("/dashboard");
    expect(safeRelativePath(42)).toBe("/dashboard");
  });

  it("honours a custom fallback", () => {
    expect(safeRelativePath(undefined, "/")).toBe("/");
  });
});
