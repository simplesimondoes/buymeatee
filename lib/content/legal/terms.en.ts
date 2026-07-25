import type { LegalDocument } from "./types";

/**
 * Terms of Use — English source text (legally binding version).
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 */
export const termsEn: LegalDocument = {
  title: "Terms of Use",
  breadcrumbLabel: "Terms",
  intro: "The ground rules for using BuyMeATee.",
  lastUpdated: "2026-07-24",
  draftNote:
    "These terms are written in plain language and have not yet been reviewed by a qualified lawyer. They are not legal advice. Because BuyMeATee handles real payments, they must be reviewed as a priority — alongside the Stripe Connected Account Agreement.",
  sections: [
    {
      heading: "What BuyMeATee is",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee is a golf-focused platform where supporters back creators with a “Tee” — a voluntary contribution toward a creator’s golf journey and goals. We provide the platform and process payments through Stripe; we are not a bank and do not hold your money. By using BuyMeATee you agree to these terms.",
        },
      ],
    },
    {
      heading: "Who operates BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee is operated by Simon Berriman, a sole trader (freelance), Karl-Rothe-Str. 4, 04105 Leipzig, Germany. Contact: [hello@buymeatee.com](mailto:hello@buymeatee.com), +49 15207075439. (German law may require these details to be presented as a separate Impressum — to be confirmed in the legal review.)",
        },
      ],
    },
    {
      heading: "Your account",
      blocks: [
        {
          kind: "list",
          items: [
            "You must be at least 18 to create an account.",
            "Sign-in is by one-time email link. Keep access to your email secure — anyone with it can access your account.",
            "You’re responsible for the activity on your account and for the accuracy of what you publish.",
          ],
        },
      ],
    },
    {
      heading: "Sending a Tee (supporters)",
      blocks: [
        {
          kind: "list",
          items: [
            "A Tee is voluntary support, not the purchase of a product or service, and not an investment, loan or donation to a registered charity. You receive no goods and no financial return.",
            "Amounts shown at checkout include the creator’s Tee plus the BuyMeATee platform fee and estimated payment-handling costs. The total is confirmed before you pay.",
            "Payment is taken by Stripe. Refunds are at the platform’s or creator’s discretion and are handled through Stripe; contact us if there’s a problem with a Tee.",
            "Don’t use BuyMeATee for money laundering, fraud, or to send funds you’re not entitled to send.",
          ],
        },
      ],
    },
    {
      heading: "Receiving Tees (creators)",
      blocks: [
        {
          kind: "list",
          items: [
            "To receive Tees you must complete onboarding with Stripe and accept the [Stripe Connected Account Agreement](https://stripe.com/legal/connect-account). Payouts, timing and identity checks are governed by Stripe.",
            "BuyMeATee retains a platform fee plus payment-handling costs from each Tee; the rest is transferred to your connected account. Fees are shown before a supporter pays and may change with notice.",
            "You are responsible for any tax you owe on support you receive. BuyMeATee does not provide tax advice.",
            "Describe your goals honestly. Support is given on trust; using goals or updates to mislead supporters is grounds for removal.",
          ],
        },
        {
          kind: "note",
          text: "**Amateur status — read this.** Accepting money or support can affect your amateur status under the Rules of Amateur Status (R&A / USGA) and the rules of your governing body, club, college or tour. These rules vary and change. It is your responsibility to check your own position before receiving Tees — BuyMeATee cannot advise on your amateur status.",
        },
      ],
    },
    {
      heading: "Your content",
      blocks: [
        {
          kind: "paragraph",
          text: "You keep ownership of what you post — your profile, goals, updates, images and links. You grant BuyMeATee a licence to host and display that content to operate the platform. You must have the right to post it, and it must not be unlawful, infringing, misleading, hateful or otherwise prohibited. Pinned media links to third-party platforms (e.g. YouTube, Instagram) are subject to those platforms’ own terms.",
        },
      ],
    },
    {
      heading: "Acceptable use and moderation",
      blocks: [
        {
          kind: "paragraph",
          text: "Don’t use BuyMeATee to break the law, infringe others’ rights, deceive supporters, or abuse the service. We may review, remove or unpublish content and suspend or close accounts that breach these terms or put supporters, creators or the platform at risk.",
        },
      ],
    },
    {
      heading: "Content and accuracy",
      blocks: [
        {
          kind: "paragraph",
          text: "We work to keep BuyMeATee honest: goal progress reflects only confirmed payments, never numbers typed in. Blog articles are general information, not professional, financial or legal advice.",
        },
      ],
    },
    {
      heading: "Intellectual property",
      blocks: [
        {
          kind: "paragraph",
          text: "The BuyMeATee name, mark and platform belong to us. You may share links freely; please don’t copy the platform or pass the brand off as your own.",
        },
      ],
    },
    {
      heading: "Disclaimers and liability",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee is provided as-is. We facilitate support between supporters and creators but don’t guarantee any creator’s conduct, goals or outcomes. To the extent the law allows, we accept no liability for the relationship between supporters and creators or for decisions made using the platform, and nothing here limits rights you have under applicable law that cannot be limited.",
        },
      ],
    },
    {
      heading: "Changes",
      blocks: [
        {
          kind: "paragraph",
          text: "We may update these terms as the product develops. The date above reflects the latest revision; material changes will be flagged.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "See also our [privacy policy](/privacy).",
    },
  ],
};
