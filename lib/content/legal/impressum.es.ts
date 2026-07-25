import type { LegalDocument } from "./types";

/**
 * Impressum (legal notice, § 5 DDG) — Spanish translation. The German
 * statutory headings are part of the notice itself and must be preserved
 * verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (impressum.en.ts) governs.
 */
export const impressumEs: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "Aviso legal y datos del operador de BuyMeATee, conforme exige la legislación alemana (§ 5 DDG).",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "Empresario individual (autónomo)",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "Alemania",
          ],
        },
      ],
    },
    {
      heading: "Kontakt · Contacto",
      blocks: [
        {
          kind: "details",
          items: [
            {
              label: "Correo electrónico",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "Teléfono",
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
          text: "Simon Berriman, Karl-Rothe-Str. 4, 04105 Leipzig, Alemania.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "footnote",
      text: "Estos datos del operador figuran también en nuestros [Términos de uso](/terms) y en nuestra [Política de privacidad](/privacy).",
    },
  ],
};
