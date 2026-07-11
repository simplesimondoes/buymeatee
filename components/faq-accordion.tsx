"use client";

import { ChevronDown } from "lucide-react";

import { trackEvent } from "@/lib/analytics";
import type { Faq } from "@/lib/content/faqs";

/**
 * Accessible FAQ accordion built on native <details>/<summary> —
 * keyboard operable and crawlable without JavaScript.
 */
export function FaqAccordion({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="divide-y divide-stone rounded-3xl border border-stone bg-white">
      {faqs.map((faq) => (
        <details
          key={faq.question}
          className="group px-5 sm:px-6"
          onToggle={(event) => {
            if ((event.target as HTMLDetailsElement).open) {
              trackEvent("faq_opened", { question: faq.question });
            }
          }}
        >
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-medium text-forest [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-gold-deep transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="pb-5 text-sm leading-relaxed text-ink/75">
            {faq.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
