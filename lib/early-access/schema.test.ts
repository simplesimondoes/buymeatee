import { describe, expect, it } from "vitest";

import { validateEarlyAccessSubmission } from "@/lib/early-access/schema";

const validInput = {
  role: "creator",
  name: "Alex Example",
  email: "alex@example.com",
  country: "United Kingdom",
  consent: true,
};

describe("validateEarlyAccessSubmission", () => {
  it("accepts a minimal valid submission", () => {
    const result = validateEarlyAccessSubmission(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        role: "creator",
        name: "Alex Example",
        email: "alex@example.com",
        country: "United Kingdom",
        consent: true,
      });
    }
  });

  it("accepts optional fields and trims whitespace", () => {
    const result = validateEarlyAccessSubmission({
      ...validInput,
      name: "  Alex Example  ",
      profileLink: "https://youtube.com/@alexexample",
      useCase: "Funding a links trip series.",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("Alex Example");
      expect(result.data.profileLink).toBe(
        "https://youtube.com/@alexexample",
      );
      expect(result.data.useCase).toBe("Funding a links trip series.");
    }
  });

  it("rejects a missing or unknown role", () => {
    const result = validateEarlyAccessSubmission({
      ...validInput,
      role: "sponsor",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.role).toBeTruthy();
  });

  it.each(["", "not-an-email", "missing@tld", "a b@example.com"])(
    "rejects invalid email %j",
    (email) => {
      const result = validateEarlyAccessSubmission({ ...validInput, email });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.errors.email).toBeTruthy();
    },
  );

  it("rejects missing name and country", () => {
    const result = validateEarlyAccessSubmission({
      role: "supporter",
      consent: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.name).toBeTruthy();
      expect(result.errors.email).toBeTruthy();
      expect(result.errors.country).toBeTruthy();
    }
  });

  it("rejects a profile link that is not a URL", () => {
    const result = validateEarlyAccessSubmission({
      ...validInput,
      profileLink: "youtube channel",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.profileLink).toBeTruthy();
  });

  it("rejects an over-long use case", () => {
    const result = validateEarlyAccessSubmission({
      ...validInput,
      useCase: "x".repeat(1001),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.useCase).toBeTruthy();
  });

  it("requires consent", () => {
    const result = validateEarlyAccessSubmission({
      ...validInput,
      consent: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.consent).toBeTruthy();
  });

  it("handles non-object input without throwing", () => {
    for (const input of [null, undefined, "text", 42, []]) {
      const result = validateEarlyAccessSubmission(input);
      expect(result.ok).toBe(false);
    }
  });
});
