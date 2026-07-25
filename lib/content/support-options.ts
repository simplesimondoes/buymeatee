/**
 * The golf-native support mechanic. Illustrative only — no checkout exists,
 * and creators will be able to customise their own options.
 *
 * Localisation: display strings live in the `content` message namespace
 * (`messages/<locale>/content.json`); the key-based `supportOptionItems`
 * export references them (keys are relative to the `content` namespace, e.g.
 * `useTranslations("content")` then `t(item.nameKey)`). The English-string
 * exports below remain as deprecated fallbacks until consumers migrate.
 */

/** Lucide icon name mapped in the presenting component. */
export type SupportOptionIcon =
  | "tee"
  | "tees"
  | "nine"
  | "eighteen"
  | "greenFee"
  | "custom";

export type SupportOption = {
  name: string;
  description: string;
  icon: SupportOptionIcon;
};

/** Locale-aware shape: stable id + message-key references, no raw English. */
export type SupportOptionItem = {
  id: string;
  icon: SupportOptionIcon;
  /** Key in the `content` namespace, e.g. "supportOptions.oneTee.name". */
  nameKey: string;
  /** Key in the `content` namespace. */
  descriptionKey: string;
};

export const supportOptionItems = [
  {
    id: "oneTee",
    icon: "tee",
    nameKey: "supportOptions.oneTee.name",
    descriptionKey: "supportOptions.oneTee.description",
  },
  {
    id: "threeTees",
    icon: "tees",
    nameKey: "supportOptions.threeTees.name",
    descriptionKey: "supportOptions.threeTees.description",
  },
  {
    id: "nineHoles",
    icon: "nine",
    nameKey: "supportOptions.nineHoles.name",
    descriptionKey: "supportOptions.nineHoles.description",
  },
  {
    id: "eighteenHoles",
    icon: "eighteen",
    nameKey: "supportOptions.eighteenHoles.name",
    descriptionKey: "supportOptions.eighteenHoles.description",
  },
  {
    id: "greenFee",
    icon: "greenFee",
    nameKey: "supportOptions.greenFee.name",
    descriptionKey: "supportOptions.greenFee.description",
  },
  {
    id: "customSupport",
    icon: "custom",
    nameKey: "supportOptions.customSupport.name",
    descriptionKey: "supportOptions.customSupport.description",
  },
] as const satisfies readonly SupportOptionItem[];

/** Key in the `content` namespace for the footnote under the options grid. */
export const supportOptionsNoteKey = "supportOptions.note" as const;

/**
 * @deprecated English-only strings. Use `supportOptionItems` with the
 * `content` message namespace instead.
 */
export const supportOptions: SupportOption[] = [
  {
    name: "1 Tee",
    description: "A simple thank-you that says keep going.",
    icon: "tee",
  },
  {
    name: "3 Tees",
    description: "A round of encouragement for the next practice session.",
    icon: "tees",
  },
  {
    name: "9 Holes",
    description: "Meaningful backing towards the next competitive nine.",
    icon: "nine",
  },
  {
    name: "18 Holes",
    description: "Fund a full round on the course that matters.",
    icon: "eighteen",
  },
  {
    name: "Green Fee",
    description: "Cover the cost of playing somewhere special.",
    icon: "greenFee",
  },
  {
    name: "Custom Support",
    description: "Choose your own way to back the journey.",
    icon: "custom",
  },
];

/**
 * @deprecated English-only string. Use `supportOptionsNoteKey` with the
 * `content` message namespace instead.
 */
export const supportOptionsNote =
  "Creators will be able to customise support options and show what each contribution helps fund.";
