/**
 * FAQ structure — single source for the /faq page and the homepage preview.
 *
 * Localisation: all question/answer/heading strings live in the `faq`
 * message namespace (`messages/<locale>/faq.json`); this module only holds
 * the stable structure with key references. Consumers translate with
 * `useTranslations("faq")` / `getTranslations("faq")` — e.g.
 * `t(item.questionKey as never)` (the cast is needed for dynamic keys).
 *
 * Answers must stay honest: no invented fees, dates, providers or traction.
 */

export type FaqItem = {
  /** Stable id — also the key segment under `items.` in faq.json. */
  id: string;
  /** Key in the `faq` namespace, e.g. "items.whatIsBuyMeATee.question". */
  questionKey: string;
  /** Key in the `faq` namespace, e.g. "items.whatIsBuyMeATee.answer". */
  answerKey: string;
};

export type FaqGroup = {
  /** Stable id — also the key segment under `groups.` in faq.json. */
  id: string;
  /** Key in the `faq` namespace, e.g. "groups.general.heading". */
  headingKey: string;
  faqs: FaqItem[];
};

function faqItem(id: string): FaqItem {
  return {
    id,
    questionKey: `items.${id}.question`,
    answerKey: `items.${id}.answer`,
  };
}

function faqGroup(id: string, itemIds: string[]): FaqGroup {
  return {
    id,
    headingKey: `groups.${id}.heading`,
    faqs: itemIds.map(faqItem),
  };
}

export const faqGroups: FaqGroup[] = [
  faqGroup("general", [
    "whatIsBuyMeATee",
    "differentFromTipping",
    "onlyForInfluencers",
  ]),
  faqGroup("forCreators", ["whoCanCreate", "whatGoals", "whatCost"]),
  faqGroup("forSupporters", [
    "whatContribute",
    "whatDoIGet",
    "followWithoutContributing",
  ]),
  faqGroup("payments", ["howPaymentsWork", "arePaymentsSecure"]),
  faqGroup("safety", ["honesty", "juniors", "personalData"]),
  faqGroup("gettingStarted", ["availableNow", "howToStart"]),
];

export const allFaqs: FaqItem[] = faqGroups.flatMap((group) => group.faqs);

/** The six questions shown in the homepage FAQ preview. */
export const homepageFaqs: FaqItem[] = [
  faqItem("whatIsBuyMeATee"),
  faqItem("whoCanCreate"),
  faqItem("onlyForInfluencers"),
  faqItem("whatContribute"),
  faqItem("howPaymentsWork"),
  faqItem("whatCost"),
];
