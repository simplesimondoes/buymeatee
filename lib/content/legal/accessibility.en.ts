import type { LegalDocument } from "./types";

/**
 * Accessibility statement — English source text (legally binding version).
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 */
export const accessibilityEn: LegalDocument = {
  title: "Accessibility",
  breadcrumbLabel: "Accessibility",
  intro:
    "Golf is for everyone, and so is BuyMeATee. Here’s how we approach accessibility — and how to tell us when we fall short.",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "Our commitment",
      blocks: [
        {
          kind: "paragraph",
          text: "We aim to meet the [Web Content Accessibility Guidelines (WCAG) 2.2, level AA](https://www.w3.org/TR/WCAG22/). Accessibility is treated as part of “done” when we build, not an afterthought, so that anyone can follow a golfer’s journey and support them regardless of how they browse.",
        },
      ],
    },
    {
      heading: "What we do",
      blocks: [
        {
          kind: "list",
          items: [
            "Semantic HTML with a clear heading structure and landmarks.",
            "A visible “skip to content” link and keyboard access to every interactive control.",
            "Visible focus styles, and controls that meet a minimum touch-target size.",
            "Colour choices checked for contrast, with meaning never carried by colour alone.",
            "Text alternatives for meaningful images and accessible names for icon-only buttons.",
            "Forms with real labels and clear, announced error and status messages.",
            "Layouts that reflow and stay usable when text is enlarged.",
          ],
        },
      ],
    },
    {
      heading: "Known limitations",
      blocks: [
        {
          kind: "paragraph",
          text: "We’re honest about the work in progress. Some areas — including parts of the payment and dashboard flows, and content submitted by creators (images, messages and links) — have not been through a full independent audit yet. Third-party components, such as Stripe-hosted checkout, follow their own providers’ accessibility standards. We fix issues as we find them and welcome reports.",
        },
      ],
    },
    {
      heading: "Tell us about a problem",
      blocks: [
        {
          kind: "paragraph",
          text: "If you hit a barrier, or need something in a different format, email [hello@buymeatee.com](mailto:hello@buymeatee.com). Please describe the page, what you were trying to do, and the assistive technology or browser you were using — it helps us fix it faster. We aim to respond within a few working days.",
        },
      ],
    },
  ],
};
