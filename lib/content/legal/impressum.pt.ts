import type { LegalDocument } from "./types";

/**
 * Impressum (legal notice, § 5 DDG) — Portuguese (pt-PT) translation. The
 * German statutory headings are part of the notice itself and must be
 * preserved verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (impressum.en.ts) governs.
 */
export const impressumPt: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "Aviso legal e dados do operador da BuyMeATee, conforme exigido pela lei alemã (§ 5 DDG).",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "Empresário em nome individual (trabalhador independente)",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "Alemanha",
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
              label: "Email",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "Telefone",
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
          text: "Simon Berriman, Karl-Rothe-Str. 4, 04105 Leipzig, Alemanha.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "footnote",
      text: "Estes dados do operador constam também dos nossos [Termos de utilização](/terms) e da nossa [Política de privacidade](/privacy).",
    },
  ],
};
