import type { LegalDocument } from "./types";

/**
 * Conditions d'utilisation — French translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (terms.en.ts) governs.
 */
export const termsFr: LegalDocument = {
  title: "Conditions d'utilisation",
  breadcrumbLabel: "Conditions",
  intro: "Les règles de base pour utiliser BuyMeATee.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Ces conditions sont rédigées en langage clair et n'ont pas encore été examinées par un juriste qualifié. Elles ne constituent pas un conseil juridique. BuyMeATee traitant de vrais paiements, leur examen est prioritaire — au même titre que le Stripe Connected Account Agreement.",
  sections: [
    {
      heading: "Ce qu'est BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee est une plateforme dédiée au golf où des supporters soutiennent des créateurs avec un « Tee » — une contribution volontaire au parcours golfique et aux objectifs d'un créateur. Nous fournissons la plateforme et traitons les paiements via Stripe ; nous ne sommes pas une banque et ne détenons pas votre argent. En utilisant BuyMeATee, vous acceptez les présentes conditions.",
        },
      ],
    },
    {
      heading: "Qui exploite BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee est exploité par Simon Berriman, entrepreneur individuel (indépendant), Karl-Rothe-Str. 4, 04105 Leipzig, Allemagne. Contact : [hello@buymeatee.com](mailto:hello@buymeatee.com), +49 15207075439. (Le droit allemand peut exiger que ces informations soient présentées dans un Impressum distinct — à confirmer lors de l'examen juridique.)",
        },
      ],
    },
    {
      heading: "Votre compte",
      blocks: [
        {
          kind: "list",
          items: [
            "Vous devez avoir au moins 18 ans pour créer un compte.",
            "La connexion s'effectue par lien à usage unique envoyé par e-mail. Protégez l'accès à votre messagerie — toute personne qui y a accès peut accéder à votre compte.",
            "Vous êtes responsable de l'activité de votre compte et de l'exactitude de ce que vous publiez.",
          ],
        },
      ],
    },
    {
      heading: "Envoyer un Tee (supporters)",
      blocks: [
        {
          kind: "list",
          items: [
            "Un Tee est un soutien volontaire : ce n'est ni l'achat d'un produit ou d'un service, ni un investissement, un prêt ou un don à une organisation caritative enregistrée. Vous ne recevez aucun bien et aucun rendement financier.",
            "Les montants affichés au moment du paiement comprennent le Tee du créateur, les frais de plateforme BuyMeATee et une estimation des frais de traitement du paiement. Le total est confirmé avant que vous ne payiez.",
            "Le paiement est encaissé par Stripe. Les remboursements sont laissés à la discrétion de la plateforme ou du créateur et sont traités via Stripe ; contactez-nous en cas de problème avec un Tee.",
            "N'utilisez pas BuyMeATee à des fins de blanchiment d'argent ou de fraude, ni pour envoyer des fonds que vous n'êtes pas en droit d'envoyer.",
          ],
        },
      ],
    },
    {
      heading: "Recevoir des Tees (créateurs)",
      blocks: [
        {
          kind: "list",
          items: [
            "Pour recevoir des Tees, vous devez finaliser votre inscription auprès de Stripe et accepter le [Stripe Connected Account Agreement](https://stripe.com/legal/connect-account). Les versements, leurs délais et les vérifications d'identité sont régis par Stripe.",
            "BuyMeATee retient sur chaque Tee des frais de plateforme ainsi que les frais de traitement du paiement ; le reste est transféré sur votre compte connecté. Les frais sont affichés avant que le supporter ne paie et peuvent évoluer moyennant préavis.",
            "Vous êtes responsable de tout impôt dû sur le soutien que vous recevez. BuyMeATee ne fournit pas de conseil fiscal.",
            "Décrivez vos objectifs honnêtement. Le soutien est accordé sur la base de la confiance ; utiliser des objectifs ou des actualités pour induire les supporters en erreur constitue un motif d'exclusion.",
          ],
        },
        {
          kind: "note",
          text: "**Statut amateur — à lire impérativement.** Accepter de l'argent ou un soutien peut affecter votre statut amateur au regard des Règles du statut d'amateur (R&A / USGA) et des règles de votre instance dirigeante, de votre club, de votre université ou de votre circuit. Ces règles varient et évoluent. Il vous appartient de vérifier votre propre situation avant de recevoir des Tees — BuyMeATee ne peut pas vous conseiller sur votre statut amateur.",
        },
      ],
    },
    {
      heading: "Votre contenu",
      blocks: [
        {
          kind: "paragraph",
          text: "Vous restez propriétaire de ce que vous publiez — votre profil, vos objectifs, vos actualités, vos images et vos liens. Vous accordez à BuyMeATee une licence d'hébergement et d'affichage de ce contenu aux fins d'exploitation de la plateforme. Vous devez avoir le droit de le publier, et il ne doit pas être illicite, contrefaisant, trompeur, haineux ou autrement interdit. Les liens de médias épinglés vers des plateformes tierces (p. ex. YouTube, Instagram) sont soumis aux conditions propres à ces plateformes.",
        },
      ],
    },
    {
      heading: "Utilisation acceptable et modération",
      blocks: [
        {
          kind: "paragraph",
          text: "N'utilisez pas BuyMeATee pour enfreindre la loi, porter atteinte aux droits d'autrui, tromper des supporters ou détourner le service. Nous pouvons examiner, retirer ou dépublier des contenus, et suspendre ou clôturer des comptes qui violent les présentes conditions ou mettent en danger les supporters, les créateurs ou la plateforme.",
        },
      ],
    },
    {
      heading: "Contenu et exactitude",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous veillons à ce que BuyMeATee reste honnête : la progression des objectifs ne reflète que des paiements confirmés, jamais des chiffres saisis à la main. Les articles du blog constituent des informations générales, et non un conseil professionnel, financier ou juridique.",
        },
      ],
    },
    {
      heading: "Propriété intellectuelle",
      blocks: [
        {
          kind: "paragraph",
          text: "Le nom, la marque et la plateforme BuyMeATee nous appartiennent. Vous pouvez partager des liens librement ; veuillez ne pas copier la plateforme ni faire passer la marque pour la vôtre.",
        },
      ],
    },
    {
      heading: "Exclusions de garantie et responsabilité",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee est fourni en l'état. Nous facilitons le soutien entre supporters et créateurs, mais nous ne garantissons ni la conduite, ni les objectifs, ni les résultats d'aucun créateur. Dans la mesure permise par la loi, nous n'assumons aucune responsabilité quant à la relation entre supporters et créateurs ni quant aux décisions prises au moyen de la plateforme, et rien dans les présentes ne limite les droits que vous confère le droit applicable et qui ne peuvent être limités.",
        },
      ],
    },
    {
      heading: "Modifications",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous pouvons mettre à jour les présentes conditions à mesure que le produit évolue. La date ci-dessus correspond à la dernière révision ; les modifications substantielles seront signalées.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consultez également notre [politique de confidentialité](/privacy).",
    },
  ],
};
