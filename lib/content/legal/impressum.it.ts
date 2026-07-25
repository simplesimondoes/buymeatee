import type { LegalDocument } from "./types";

/**
 * Impressum (legal notice, § 5 DDG) — Italian translation. The German
 * statutory headings are part of the notice itself and must be preserved
 * verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (impressum.en.ts) governs.
 */
export const impressumIt: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "Nota legale e dati del gestore di BuyMeATee, come richiesto dal diritto tedesco (§ 5 DDG).",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "Ditta individuale (libero professionista)",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "Germania",
          ],
        },
      ],
    },
    {
      heading: "Kontakt · Contatti",
      blocks: [
        {
          kind: "details",
          items: [
            {
              label: "E-mail",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "Telefono",
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
          text: "Simon Berriman, Karl-Rothe-Str. 4, 04105 Leipzig, Germania.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "footnote",
      text: "Questi dati del gestore figurano anche nei nostri [Termini di utilizzo](/terms) e nella nostra [Informativa sulla privacy](/privacy).",
    },
  ],
};
