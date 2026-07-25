import type { LegalDocument } from "./types";

/**
 * Déclaration d'accessibilité — French translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (accessibility.en.ts) governs.
 */
export const accessibilityFr: LegalDocument = {
  title: "Accessibilité",
  breadcrumbLabel: "Accessibilité",
  intro:
    "Le golf est fait pour tout le monde, et BuyMeATee aussi. Voici notre approche de l'accessibilité — et comment nous signaler nos manquements.",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "Notre engagement",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous visons la conformité aux [Règles pour l'accessibilité des contenus web (WCAG) 2.2, niveau AA](https://www.w3.org/TR/WCAG22/). L'accessibilité est traitée comme une partie intégrante du travail « terminé » lorsque nous développons, et non comme une réflexion après coup, afin que chacun puisse suivre le parcours d'un golfeur et le soutenir, quelle que soit sa façon de naviguer.",
        },
      ],
    },
    {
      heading: "Ce que nous faisons",
      blocks: [
        {
          kind: "list",
          items: [
            "Un HTML sémantique avec une structure de titres claire et des points de repère (landmarks).",
            "Un lien visible « aller au contenu » et un accès au clavier pour chaque commande interactive.",
            "Des styles de focus visibles, et des commandes respectant une taille minimale de cible tactile.",
            "Des choix de couleurs vérifiés pour le contraste, le sens n'étant jamais porté par la couleur seule.",
            "Des alternatives textuelles pour les images porteuses de sens et des noms accessibles pour les boutons composés uniquement d'une icône.",
            "Des formulaires avec de véritables étiquettes et des messages d'erreur et d'état clairs et annoncés.",
            "Des mises en page qui se réagencent et restent utilisables lorsque le texte est agrandi.",
          ],
        },
      ],
    },
    {
      heading: "Limites connues",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous sommes honnêtes sur le travail en cours. Certaines zones — dont des parties des flux de paiement et du tableau de bord, ainsi que le contenu soumis par les créateurs (images, messages et liens) — n'ont pas encore fait l'objet d'un audit indépendant complet. Les composants tiers, tels que le paiement hébergé par Stripe, suivent les normes d'accessibilité de leurs propres fournisseurs. Nous corrigeons les problèmes au fur et à mesure que nous les découvrons et vos signalements sont les bienvenus.",
        },
      ],
    },
    {
      heading: "Signalez-nous un problème",
      blocks: [
        {
          kind: "paragraph",
          text: "Si vous rencontrez un obstacle, ou si vous avez besoin d'un contenu dans un autre format, écrivez à [hello@buymeatee.com](mailto:hello@buymeatee.com). Décrivez la page, ce que vous tentiez de faire, ainsi que la technologie d'assistance ou le navigateur que vous utilisiez — cela nous aide à corriger plus vite. Nous nous efforçons de répondre sous quelques jours ouvrés.",
        },
      ],
    },
  ],
};
