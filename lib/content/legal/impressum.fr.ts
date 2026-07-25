import type { LegalDocument } from "./types";

/**
 * Impressum (mentions légales, § 5 DDG) — French translation. The German
 * statutory headings are part of the notice itself and must be preserved
 * verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (impressum.en.ts) governs.
 */
export const impressumFr: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "Mentions légales et coordonnées de l'exploitant de BuyMeATee, conformément au droit allemand (§ 5 DDG).",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "Entrepreneur individuel (indépendant)",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "Allemagne",
          ],
        },
      ],
    },
    {
      heading: "Kontakt · Contact",
      blocks: [
        {
          kind: "details",
          items: [
            {
              label: "E-mail",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "Téléphone",
              value: "[+49 15207075439](tel:+4915207075439)",
            },
          ],
        },
      ],
    },
    {
      heading: "Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV",
      blocks: [
        {
          kind: "paragraph",
          text: "Simon Berriman, Karl-Rothe-Str. 4, 04105 Leipzig, Allemagne.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "footnote",
      text: "Ces coordonnées de l'exploitant figurent également dans nos [Conditions d'utilisation](/terms) et notre [Politique de confidentialité](/privacy).",
    },
  ],
};
