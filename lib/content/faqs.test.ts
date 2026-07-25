import { describe, expect, it } from "vitest";

import { allFaqs, faqGroups, homepageFaqs } from "@/lib/content/faqs";
import faqMessages from "@/messages/en/faq.json";

/**
 * The FAQ structure is key-based; every referenced key must resolve to a
 * non-empty string in the English source catalog (messages/en/faq.json).
 */

function resolve(key: string): string {
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object"
          ? (node as Record<string, unknown>)[part]
          : undefined,
      faqMessages,
    );
  expect(typeof value, `key "${key}" must resolve to a string`).toBe("string");
  expect((value as string).length).toBeGreaterThan(0);
  return value as string;
}

describe("faq structure", () => {
  it("resolves every group heading and question/answer key in en", () => {
    for (const group of faqGroups) {
      resolve(group.headingKey);
      for (const item of group.faqs) {
        resolve(item.questionKey);
        resolve(item.answerKey);
      }
    }
  });

  it("has unique item ids across all groups", () => {
    const ids = allFaqs.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("previews only questions that exist on the full FAQ page", () => {
    const allIds = new Set(allFaqs.map((item) => item.id));
    expect(homepageFaqs).toHaveLength(6);
    for (const item of homepageFaqs) {
      expect(allIds.has(item.id), `homepage FAQ "${item.id}"`).toBe(true);
      resolve(item.questionKey);
      resolve(item.answerKey);
    }
  });
});
