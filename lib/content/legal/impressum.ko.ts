import type { LegalDocument } from "./types";

/**
 * Impressum (legal notice, § 5 DDG) — Korean translation. The German
 * statutory headings are part of the notice itself and must be preserved
 * verbatim in every translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (impressum.en.ts) governs.
 */
export const impressumKo: LegalDocument = {
  title: "Impressum",
  breadcrumbLabel: "Impressum",
  intro:
    "독일 법률(§ 5 DDG)에 따라 요구되는 BuyMeATee의 법적 고지 및 운영자 정보입니다.",
  sections: [
    {
      heading: "Angaben gemäß § 5 DDG",
      blocks: [
        {
          kind: "lines",
          lines: [
            "Simon Berriman",
            "개인사업자(프리랜서)",
            "Karl-Rothe-Str. 4",
            "04105 Leipzig",
            "Germany",
          ],
        },
      ],
    },
    {
      heading: "Kontakt · 연락처",
      blocks: [
        {
          kind: "details",
          items: [
            {
              label: "이메일",
              value: "[hello@buymeatee.com](mailto:hello@buymeatee.com)",
            },
            {
              label: "전화",
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
      text: "이 운영자 정보는 당사의 [이용약관](/terms)과 [개인정보 처리방침](/privacy)에도 기재되어 있습니다.",
    },
  ],
};
