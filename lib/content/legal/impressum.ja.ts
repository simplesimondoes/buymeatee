import type { LegalDocument } from "./types";

/**
 * Impressum (legal notice, § 5 DDG) — Japanese translation. The German
 * statutory headings are part of the notice itself and must be preserved
 * verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (impressum.en.ts) governs.
 */
export const impressumJa: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "ドイツ法（§ 5 DDG）に基づき義務付けられている、BuyMeATeeの法定表示および運営者情報です。",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "個人事業主（フリーランス）",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "ドイツ",
          ],
        },
      ],
    },
    {
      heading: "Kontakt · お問い合わせ",
      blocks: [
        {
          kind: "details",
          items: [
            {
              label: "メール",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "電話",
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
          text: "Simon Berriman, Karl-Rothe-Str. 4, 04105 Leipzig, ドイツ。",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "footnote",
      text: "これらの運営者情報は、[利用規約](/terms)と[プライバシーポリシー](/privacy)にも記載されています。",
    },
  ],
};
