import type { LegalDocument } from "./types";

/**
 * Privacy Policy — English source text (legally binding version).
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 */
export const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  breadcrumbLabel: "Privacy",
  intro: "What we collect, why, who processes it, and the choices you have.",
  lastUpdated: "2026-07-24",
  draftNote:
    "This policy describes what the product actually does, but it has not yet been reviewed by a qualified lawyer or data-protection adviser. It is not legal advice. The payments, accounts and analytics sections in particular still need sign-off from a qualified adviser.",
  sections: [
    {
      heading: "Who we are",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee (“we”, “us”) is the platform at buymeatee.com — a golf-focused way for supporters to back creators with a “Tee”. It is operated by Simon Berriman, a sole trader based at Karl-Rothe-Str. 4, 04105 Leipzig, Germany, who is the data controller for the personal data described here. For payments we work with Stripe, who acts as an independent controller for the payment and identity-verification data it collects (see “Payments” below). For any privacy request, contact [hello@buymeatee.com](mailto:hello@buymeatee.com) or +49 15207075439. Full operator details are in our [Impressum](/impressum).",
        },
      ],
    },
    {
      heading: "What we collect",
      blocks: [
        {
          kind: "paragraph",
          text: "**Accounts:** we use passwordless sign-in, so we hold your email address and sign-in session data. We never store passwords.",
        },
        {
          kind: "paragraph",
          text: "**Creator profiles:** the details you choose to publish — display name, page link (username), bio and About text, photo and cover image, and optional golf details (handicap, location, home club, handedness), social links, pinned media, goals and posted updates. This information is public by design.",
        },
        {
          kind: "paragraph",
          text: "**Sending or receiving Tees:** when you send a Tee we handle the amount, an optional message, the name shown (or “Anonymous” if you choose), and — if you provide one — an email for your receipt. Card details are entered directly with Stripe and never reach our servers. Creators who receive Tees complete identity and payout setup with Stripe.",
        },
      ],
    },
    {
      heading: "Cookies and analytics",
      blocks: [
        {
          kind: "paragraph",
          text: "We use strictly-necessary cookies to keep you signed in, and a functional cookie (`NEXT_LOCALE`) to remember your language choice — these are always on because the site needs them to work and they are not used for tracking. We also use Google Analytics (GA4) to understand, in aggregate, how the site is used, which sets analytics cookies. Analytics only loads if you accept it: on your first visit a banner asks for your choice, and nothing analytics-related runs until you opt in. You can change or withdraw your choice at any time via **Cookie settings** in the footer.",
        },
      ],
    },
    {
      heading: "Why we collect it, and our legal basis",
      blocks: [
        {
          kind: "list",
          items: [
            "To provide the service — accounts, creator pages, goals, updates and processing Tees (*performance of a contract*).",
            "To send transactional email — sign-in links, gift receipts and creator notifications (*contract / legitimate interests*).",
            "To keep the platform secure, prevent fraud and abuse, and understand usage (*legitimate interests*).",
            "To meet legal, tax and anti-money-laundering obligations around payments (*legal obligation*, largely via Stripe).",
          ],
        },
        {
          kind: "paragraph",
          text: "We do not sell your personal data.",
        },
      ],
    },
    {
      heading: "Payments (Stripe)",
      blocks: [
        {
          kind: "paragraph",
          text: "Payments run on Stripe using Stripe Connect. When you pay, your card details go directly to Stripe — BuyMeATee never sees or stores them. Creators receiving Tees onboard with Stripe, which collects the identity and bank details it needs to verify them and pay them out; Stripe processes that data as an independent controller under its own [privacy policy](https://stripe.com/privacy). We store a record of each Tee (amounts, status, references and any message) to run the service, show progress and handle refunds and disputes.",
        },
      ],
    },
    {
      heading: "Who processes your data",
      blocks: [
        {
          kind: "paragraph",
          text: "We share personal data only with service providers who help us run BuyMeATee:",
        },
        {
          kind: "list",
          items: [
            "**Supabase** — database, file storage and authentication (hosted in the EU).",
            "**Stripe** — payments, payouts and identity verification.",
            "**Resend** — sending transactional email.",
            "**Vercel** — website hosting and standard server logs.",
            "**Google Analytics** — aggregate usage analytics (only after you opt in).",
            "**OpenAI** — optional AI drafting of suggested share and social-post copy; it processes only the content a creator chooses to have personalised (based in the United States).",
            "**Printful** — print-on-demand production and shipping of merchandise orders, including the customer name and delivery address needed to fulfil and post an order (based in the United States).",
          ],
        },
        {
          kind: "paragraph",
          text: "Some of these providers (including Stripe, Vercel, Google Analytics, OpenAI and Printful) are based in, or process data in, the United States. Where personal data leaves the UK/EEA, it is protected by appropriate safeguards such as Standard Contractual Clauses. The full processor list and transfer mechanisms will be confirmed in the legal review.",
        },
      ],
    },
    {
      heading: "How long we keep it",
      blocks: [
        {
          kind: "paragraph",
          text: "We keep your account and profile data for as long as you have an account, and delete it within about 30 days after you close your account — except where we are legally required to keep it longer. Payment, invoice and tax records are retained for the statutory period required of a German business (generally up to 10 years under the German Commercial Code (HGB) and Fiscal Code (AO)). Public content you post remains visible until you remove it or close your account.",
        },
      ],
    },
    {
      heading: "Your rights",
      blocks: [
        {
          kind: "paragraph",
          text: "Under the EU GDPR (and equivalent UK law) you can ask to access, correct, delete or export your personal data, object to or restrict certain processing, and withdraw consent at any time. You can also complain to a data-protection supervisory authority: as the operator is established in Germany, the competent authority is the Saxon Data Protection and Transparency Officer (Sächsische Datenschutz- und Transparenzbeauftragte), and you may also contact the authority in your own country of residence. Some payment and tax records must be retained even if you ask for deletion.",
        },
      ],
    },
    {
      heading: "Children",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee is for adults (18+). Junior golfers take part only through an appropriate parent or guardian, who is responsible for their participation.",
        },
      ],
    },
    {
      heading: "Changes to this policy",
      blocks: [
        {
          kind: "paragraph",
          text: "We’ll update this policy as the product evolves; the date above reflects the latest revision. Material changes will be highlighted before they take effect.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "See also our [terms](/terms) and [FAQ](/faq).",
    },
  ],
};
