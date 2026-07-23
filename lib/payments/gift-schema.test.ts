import { describe, expect, it } from "vitest";

import {
  parseMajorAmountToMinor,
  validateGiftInput,
} from "@/lib/payments/gift-schema";

const valid = {
  recipientUsername: "sam-golfer",
  giftAmount: 500,
  currency: "gbp",
  senderName: "Alex",
  senderEmail: "alex@example.com",
  message: "Great round on Sunday!",
  isAnonymous: false,
};

describe("validateGiftInput", () => {
  it("accepts a complete valid payload", () => {
    const result = validateGiftInput(valid);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.recipientUsername).toBe("sam-golfer");
    expect(result.data.giftAmount).toBe(500);
    expect(result.data.isAnonymous).toBe(false);
  });

  it("normalises the username to lower case", () => {
    const result = validateGiftInput({ ...valid, recipientUsername: "Sam-Golfer" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.recipientUsername).toBe("sam-golfer");
  });

  it("treats email and message as optional", () => {
    const result = validateGiftInput({
      ...valid,
      senderEmail: "",
      message: undefined,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.senderEmail).toBeUndefined();
    expect(result.data.message).toBeUndefined();
  });

  it("rejects invalid usernames", () => {
    // Note: single-character usernames are valid per the profiles DB pattern.
    for (const username of ["", "ab", "-bad", "bad-", "Bad_Name!", "a".repeat(41)]) {
      const result = validateGiftInput({ ...valid, recipientUsername: username });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects non-integer, zero and manipulated amounts", () => {
    for (const giftAmount of [0, -5, 5.5, "500", null, Number.MAX_SAFE_INTEGER + 1]) {
      const result = validateGiftInput({ ...valid, giftAmount });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects unsupported currencies", () => {
    const result = validateGiftInput({ ...valid, currency: "usd" });
    expect(result.ok).toBe(false);
  });

  it("enforces sender name and message limits", () => {
    expect(validateGiftInput({ ...valid, senderName: "" }).ok).toBe(false);
    expect(validateGiftInput({ ...valid, senderName: "x".repeat(101) }).ok).toBe(false);
    expect(validateGiftInput({ ...valid, message: "x".repeat(281) }).ok).toBe(false);
  });

  it("rejects malformed emails", () => {
    expect(validateGiftInput({ ...valid, senderEmail: "not-an-email" }).ok).toBe(false);
  });

  it("only treats an explicit true as anonymous", () => {
    const result = validateGiftInput({ ...valid, isAnonymous: "yes" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.isAnonymous).toBe(false);
  });

  it("survives junk payloads", () => {
    expect(validateGiftInput(null).ok).toBe(false);
    expect(validateGiftInput("gift").ok).toBe(false);
    expect(validateGiftInput(undefined).ok).toBe(false);
  });
});

describe("parseMajorAmountToMinor", () => {
  it("parses whole and decimal amounts without floats", () => {
    expect(parseMajorAmountToMinor("5")).toBe(500);
    expect(parseMajorAmountToMinor("5.5")).toBe(550);
    expect(parseMajorAmountToMinor("5.55")).toBe(555);
    expect(parseMajorAmountToMinor("7,50")).toBe(750);
    expect(parseMajorAmountToMinor(" 12.30 ")).toBe(1230);
    // Classic float trap: 0.1 + 0.2 — string arithmetic is exact.
    expect(parseMajorAmountToMinor("0.30")).toBe(30);
  });

  it("rejects unparseable input", () => {
    for (const raw of ["", "abc", "5.555", "-5", "£5", "5.5.5", "1e3"]) {
      expect(parseMajorAmountToMinor(raw)).toBeNull();
    }
  });
});

describe("goalId", () => {
  it("is optional and omitted when blank", () => {
    const withoutGoal = validateGiftInput({ ...valid, goalId: "" });
    expect(withoutGoal.ok).toBe(true);
    if (withoutGoal.ok) {
      expect(withoutGoal.data.goalId).toBeUndefined();
    }
  });

  it("accepts a well-formed goal id", () => {
    const result = validateGiftInput({
      ...valid,
      goalId: "44444444-4444-4444-8444-444444444444",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.goalId).toBe("44444444-4444-4444-8444-444444444444");
    }
  });

  it("rejects malformed goal references", () => {
    for (const goalId of ["not-a-uuid", "123", "44444444-4444-4444-8444"]) {
      const result = validateGiftInput({ ...valid, goalId });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.goalId).toBeDefined();
      }
    }
  });
});
