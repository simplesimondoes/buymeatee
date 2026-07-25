import type { LegalDocument } from "./types";

/**
 * Accessibility statement — Japanese translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (accessibility.en.ts)
 * governs.
 */
export const accessibilityJa: LegalDocument = {
  title: "アクセシビリティ",
  breadcrumbLabel: "アクセシビリティ",
  intro:
    "ゴルフはすべての人のもの。BuyMeATeeも同じです。アクセシビリティへの私たちの取り組みと、不十分な点を見つけたときの伝え方をご案内します。",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "私たちの約束",
      blocks: [
        {
          kind: "paragraph",
          text: "私たちは[ウェブコンテンツ・アクセシビリティ・ガイドライン（WCAG）2.2 レベルAA](https://www.w3.org/TR/WCAG22/)への適合を目指しています。アクセシビリティは後付けではなく、開発時の「完成」の条件の一部として扱っています。どのような方法でブラウズしていても、誰もがゴルファーのジャーニーを追いかけ、応援できるようにするためです。",
        },
      ],
    },
    {
      heading: "取り組んでいること",
      blocks: [
        {
          kind: "list",
          items: [
            "明確な見出し構造とランドマークを備えたセマンティックHTML。",
            "目に見える「コンテンツへスキップ」リンクと、すべてのインタラクティブなコントロールへのキーボードアクセス。",
            "視認できるフォーカススタイルと、最小タッチターゲットサイズを満たすコントロール。",
            "コントラストを検証した配色。意味を色だけで伝えることはありません。",
            "意味のある画像への代替テキストと、アイコンのみのボタンへのアクセシブルな名前。",
            "実際のラベルを備えたフォームと、明確に読み上げられるエラー・ステータスメッセージ。",
            "文字を拡大してもリフローし、使いやすさを保つレイアウト。",
          ],
        },
      ],
    },
    {
      heading: "既知の制限",
      blocks: [
        {
          kind: "paragraph",
          text: "進行中の課題については正直にお伝えします。一部の領域 — 決済やダッシュボードのフローの一部、クリエイターが投稿するコンテンツ（画像、メッセージ、リンク）など — は、まだ独立した完全な監査を受けていません。Stripeがホストするチェックアウトなどのサードパーティコンポーネントは、各提供者自身のアクセシビリティ基準に従います。問題は見つけ次第修正しており、報告を歓迎します。",
        },
      ],
    },
    {
      heading: "問題を見つけたら",
      blocks: [
        {
          kind: "paragraph",
          text: "障壁に遭遇した場合や、別の形式での提供が必要な場合は、[hello@buymeatee.com](mailto:hello@buymeatee.com)までメールでご連絡ください。該当するページ、行おうとしていた操作、使用していた支援技術やブラウザをお知らせいただけると、より早く修正できます。数営業日以内の返信を心がけています。",
        },
      ],
    },
  ],
};
