import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FaqAccordion } from "@/components/faq-accordion";
import { homepageFaqs } from "@/lib/content/faqs";

describe("FaqAccordion", () => {
  it("renders every question and answer in the document (crawlable)", () => {
    render(<FaqAccordion faqs={homepageFaqs} />);
    for (const faq of homepageFaqs) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
      expect(screen.getByText(faq.answer)).toBeInTheDocument();
    }
  });

  it("uses native disclosure elements for keyboard accessibility", () => {
    const { container } = render(<FaqAccordion faqs={homepageFaqs} />);
    const details = container.querySelectorAll("details");
    const summaries = container.querySelectorAll("summary");
    expect(details.length).toBe(homepageFaqs.length);
    expect(summaries.length).toBe(homepageFaqs.length);
  });
});
