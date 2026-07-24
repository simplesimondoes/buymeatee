/**
 * FAQ content — single source for the /faq page and the homepage preview.
 * Answers must stay honest: no invented fees, dates, providers or traction.
 */

export type Faq = {
  question: string;
  answer: string;
};

export type FaqGroup = {
  heading: string;
  faqs: Faq[];
};

export const faqGroups: FaqGroup[] = [
  {
    heading: "General",
    faqs: [
      {
        question: "What is BuyMeATee?",
        answer:
          "BuyMeATee is a golf-focused creator-support platform. Golf creators, aspiring professionals, amateur competitors, coaches and course reviewers share their goals — a trip, a season, a challenge, a content series — and the people who follow them contribute towards making those goals happen, from a single tee upwards.",
      },
      {
        question: "How is BuyMeATee different from a general tipping site?",
        answer:
          "Everything is built around real golfing goals rather than one-off tips. Support is golf-native — tees, holes, rounds and green fees — and creators share progress and updates so supporters can see what they helped make possible.",
      },
      {
        question: "Is BuyMeATee only for influencers?",
        answer:
          "No. BuyMeATee is designed for small and emerging golfers as much as established creators — amateur competitors, coaches, course reviewers, travel and women's golf creators, adaptive golfers and juniors (represented by a parent or guardian) are all part of the picture.",
      },
    ],
  },
  {
    heading: "For creators",
    faqs: [
      {
        question: "Who can create a page?",
        answer:
          "Any golfer with a journey worth following: content creators on YouTube, TikTok or Instagram, amateur tournament players, aspiring professionals, coaches, course reviewers and golf travel creators. Accounts involving anyone under 18 will require an appropriate parent or guardian.",
      },
      {
        question: "What kind of goals can I share?",
        answer:
          "Anything concrete that supporters can get behind: green fees, tournament entries, travel and accommodation, equipment, coaching, content production, a specific challenge or a full competitive season.",
      },
      {
        question: "What will it cost me?",
        answer:
          "Creating a page and sharing goals is free. When a supporter buys you a tee, BuyMeATee keeps a small platform fee and standard card-processing costs apply; the rest goes to you. The full breakdown is shown before anyone confirms a contribution — no surprises buried in small print.",
      },
    ],
  },
  {
    heading: "For supporters",
    faqs: [
      {
        question: "What can supporters contribute towards?",
        answer:
          "Specific goals that creators share — from green fees and tournament entries to travel, equipment, coaching and content production. You choose something meaningful: one tee, three tees, nine holes, a full round, a green fee or a custom amount.",
      },
      {
        question: "What do I get for supporting someone?",
        answer:
          "You become part of the journey. Creators share progress, milestones and updates with their supporters. Supporting is not an investment and does not buy ownership or guaranteed content — it is a way to back a golfer you believe in.",
      },
      {
        question: "Can I follow a creator without contributing?",
        answer:
          "Yes — creators' journeys are there to be followed. Contributing is always a choice, never a condition.",
      },
    ],
  },
  {
    heading: "Payments and fees",
    faqs: [
      {
        question: "How do payments work?",
        answer:
          "Supporters pay securely by card through Stripe's hosted checkout. The money goes to the creator's connected Stripe account, minus a small platform fee and card-processing costs. Creators connect a Stripe account to receive payouts, and BuyMeATee never sees or stores card details.",
      },
      {
        question: "Are payments secure?",
        answer:
          "Yes. All payments are processed by Stripe, a global payments provider. Card details are entered on Stripe's secure checkout and never touch BuyMeATee's servers. A goal's total only moves when a payment genuinely clears.",
      },
    ],
  },
  {
    heading: "Safety and trust",
    faqs: [
      {
        question: "How does BuyMeATee handle honesty on creator pages?",
        answer:
          "Honesty is a founding principle. Real creator pages show real, verified progress — a goal's total only moves when a payment genuinely clears, never by hand. Any illustrative example used to show how the product works is always clearly labelled as an example.",
      },
      {
        question: "What about junior golfers?",
        answer:
          "Junior golfers will only appear on BuyMeATee represented by an appropriate parent or guardian. Minors will never be able to enter financial agreements independently on the platform.",
      },
      {
        question: "What personal data do you collect?",
        answer:
          "As little as possible. Creating an account stores your email; creators add the profile details they choose to show and connect a Stripe account to receive payouts. Supporters' card details are handled entirely by Stripe and never stored by us. See the privacy policy for the full picture.",
      },
    ],
  },
  {
    heading: "Getting started",
    faqs: [
      {
        question: "Is BuyMeATee available now?",
        answer:
          "Yes — BuyMeATee is live. You can create your page and share a goal as a creator, or back a golfer you follow as a supporter, today.",
      },
      {
        question: "How do I get started?",
        answer:
          "Sign in with your email to create your page and set up your first goal, or find a creator to support. There are no passwords — we email you a secure one-time sign-in link.",
      },
    ],
  },
];

/** The six questions shown in the homepage FAQ preview. */
export const homepageFaqs: Faq[] = [
  faqGroups[0].faqs[0], // What is BuyMeATee?
  faqGroups[1].faqs[0], // Who can create a page?
  faqGroups[0].faqs[2], // Is BuyMeATee only for influencers?
  faqGroups[2].faqs[0], // What can supporters contribute towards?
  faqGroups[3].faqs[0], // How do payments work?
  faqGroups[5].faqs[0], // Is BuyMeATee available now?
];

export const allFaqs: Faq[] = faqGroups.flatMap((group) => group.faqs);
