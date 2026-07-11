/**
 * The golf-native support mechanic. Illustrative only — no checkout exists,
 * and creators will be able to customise their own options.
 */

export type SupportOption = {
  name: string;
  description: string;
  /** Lucide icon name mapped in the presenting component. */
  icon: "tee" | "tees" | "nine" | "eighteen" | "greenFee" | "custom";
};

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

export const supportOptionsNote =
  "Creators will be able to customise support options and show what each contribution helps fund.";
