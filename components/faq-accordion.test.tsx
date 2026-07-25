import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqAccordion } from "@/components/faq-accordion";
import { homepageFaqs } from "@/lib/content/faqs";
import faqMessages from "@/messages/en/faq.json";

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
  return value as string;
}

/** The accordion is dumb: parents pass already-translated strings. */
const faqs = homepageFaqs.map((item) => ({
  question: resolve(item.questionKey),
  answer: resolve(item.answerKey),
}));

describe("FaqAccordion", () => {
  it("renders every question and answer in the document (crawlable)", () => {
    render(<FaqAccordion faqs={faqs} />);
    for (const faq of faqs) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
  });

  it("uses native disclosure elements for keyboard accessibility", () => {
    const { container } = render(<FaqAccordion faqs={faqs} />);
    const details = container.querySelectorAll("details");
    const summaries = container.querySelectorAll("summary");
    expect(details.length).toBe(faqs.length);
    expect(summaries.length).toBe(faqs.length);
  });
});
