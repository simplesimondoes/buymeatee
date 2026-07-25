import type { LegalDocument } from "./types";

/**
 * Impressum (legal notice, § 5 DDG) — English source text (legally binding
 * version). The German statutory headings are part of the notice itself and
 * must be preserved verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 */
export const impressumEn: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "Legal notice and operator details for BuyMeATee, as required under German law (§ 5 DDG).",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "Sole trader (freelance)",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "Germany",
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
              label: "Email",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "Phone",
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
          text: "Simon Berriman, Karl-Rothe-Str. 4, 04105 Leipzig, Germany.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "footnote",
      text: "These operator details also appear in our [Terms of Use](/terms) and [Privacy Policy](/privacy).",
    },
  ],
};
