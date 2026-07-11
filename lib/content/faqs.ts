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
          "BuyMeATee is in early development and fees have not been finalised. Final payment and fee details will be published transparently before launch — there will be no surprises buried in small print.",
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
        question: "How will payments work?",
        answer:
          "Payments are not live yet. BuyMeATee is in early development and a payment provider has not been selected. The platform is being designed around transparent goals and responsible payments, and final payment and fee details will be published before launch.",
      },
      {
        question: "Will supporters be charged anything today?",
        answer:
          "No. Nothing on this site takes payment. Right now you can register early-access interest — that is all.",
      },
    ],
  },
  {
    heading: "Safety and trust",
    faqs: [
      {
        question: "How does BuyMeATee handle honesty on creator pages?",
        answer:
          "Honesty is a founding principle. Even on this pre-launch site, every fictional creator, goal or preview is clearly labelled as an example — and the same standard of transparency will apply to real creator pages, goals and progress at launch.",
      },
      {
        question: "What about junior golfers?",
        answer:
          "Junior golfers will only appear on BuyMeATee represented by an appropriate parent or guardian. Minors will never be able to enter financial agreements independently on the platform.",
      },
      {
        question: "What personal data do you collect?",
        answer:
          "As little as possible. The early-access form asks for your name, email, role and country, plus optional extras you choose to share. See the privacy policy for the full picture.",
      },
    ],
  },
  {
    heading: "Launch and availability",
    faqs: [
      {
        question: "When will BuyMeATee launch?",
        answer:
          "A launch date has not been set. The team is validating the idea with creators and supporters first — joining early access is the best way to shape the product and hear about launch as soon as there is news.",
      },
      {
        question: "How do I get early access?",
        answer:
          "Register your interest through the early-access form as a creator or a supporter. Early registrants will be first in line as features roll out.",
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
  faqGroups[3].faqs[0], // How will payments work?
  faqGroups[5].faqs[0], // When will BuyMeATee launch?
];

export const allFaqs: Faq[] = faqGroups.flatMap((group) => group.faqs);
