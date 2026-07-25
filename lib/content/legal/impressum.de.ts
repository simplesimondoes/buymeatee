import type { LegalDocument } from "./types";

/**
 * Impressum (Anbieterkennzeichnung, § 5 DDG) — German translation. The
 * German statutory headings are part of the notice itself and must be
 * preserved verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (impressum.en.ts) governs.
 */
export const impressumDe: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "Anbieterkennzeichnung und Betreiberangaben für BuyMeATee, wie nach deutschem Recht (§ 5 DDG) erforderlich.",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "Einzelunternehmer (freiberuflich)",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "Deutschland",
          ],
        },
      ],
    },
    {
      heading: "Kontakt",
      blocks: [
        {
          kind: "details",
          items: [
            {
              label: "E-Mail",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "Telefon",
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
          text: "Simon Berriman, Karl-Rothe-Str. 4, 04105 Leipzig, Deutschland.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "footnote",
      text: "Diese Betreiberangaben finden sich auch in unseren [Nutzungsbedingungen](/terms) und unserer [Datenschutzerklärung](/privacy).",
    },
  ],
};
