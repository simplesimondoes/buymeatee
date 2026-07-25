import type { LegalDocument } from "./types";

/**
 * Politique de confidentialité — French translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (privacy.en.ts) governs.
 */
export const privacyFr: LegalDocument = {
  title: "Politique de confidentialité",
  breadcrumbLabel: "Confidentialité",
  intro:
    "Ce que nous collectons, pourquoi, qui le traite, et les choix dont vous disposez.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Cette politique décrit ce que le produit fait réellement, mais elle n'a pas encore été examinée par un juriste qualifié ou un conseiller en protection des données. Elle ne constitue pas un conseil juridique. Les sections consacrées aux paiements, aux comptes et à l'analyse d'audience, en particulier, doivent encore être validées par un conseiller qualifié.",
  sections: [
    {
      heading: "Qui nous sommes",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee (« nous ») est la plateforme accessible sur buymeatee.com — un moyen, centré sur le golf, pour des supporters de soutenir des créateurs avec un « Tee ». Elle est exploitée par Simon Berriman, entrepreneur individuel établi Karl-Rothe-Str. 4, 04105 Leipzig, Allemagne, qui est le responsable du traitement des données personnelles décrites ici. Pour les paiements, nous travaillons avec Stripe, qui agit en qualité de responsable de traitement indépendant pour les données de paiement et de vérification d'identité qu'il collecte (voir « Paiements » ci-dessous). Pour toute demande relative à vos données, contactez [hello@buymeatee.com](mailto:hello@buymeatee.com) ou le +49 15207075439. Les coordonnées complètes de l'exploitant figurent dans notre [Impressum](/impressum).",
        },
      ],
    },
    {
      heading: "Ce que nous collectons",
      blocks: [
        {
          kind: "paragraph",
          text: "**Comptes :** nous utilisons une connexion sans mot de passe ; nous conservons donc votre adresse e-mail et les données de session de connexion. Nous ne stockons jamais de mots de passe.",
        },
        {
          kind: "paragraph",
          text: "**Profils de créateur :** les informations que vous choisissez de publier — nom affiché, lien de page (nom d'utilisateur), bio et texte « À propos », photo et image de couverture, et, en option, des détails golf (index, localisation, club d'attache, joueur droitier ou gaucher), liens vers les réseaux sociaux, médias épinglés, objectifs et actualités publiées. Ces informations sont publiques par conception.",
        },
        {
          kind: "paragraph",
          text: "**Envoi ou réception de Tees :** lorsque vous envoyez un Tee, nous traitons le montant, un message facultatif, le nom affiché (ou « Anonyme » si vous le choisissez) et — si vous en fournissez une — une adresse e-mail pour votre reçu. Les données de carte sont saisies directement auprès de Stripe et n'atteignent jamais nos serveurs. Les créateurs qui reçoivent des Tees effectuent la vérification d'identité et la configuration des versements auprès de Stripe.",
        },
      ],
    },
    {
      heading: "Cookies et analyse d'audience",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous utilisons des cookies essentiels pour vous maintenir connecté — ils sont toujours actifs, car le site en a besoin pour fonctionner. Nous utilisons également Google Analytics (GA4) pour comprendre, de manière agrégée, comment le site est utilisé, ce qui dépose des cookies d'analyse. L'analyse d'audience ne se charge que si vous l'acceptez : lors de votre première visite, un bandeau vous demande votre choix, et rien de lié à l'analyse ne s'exécute tant que vous n'avez pas donné votre accord. Vous pouvez modifier ou retirer votre choix à tout moment via **Paramètres des cookies** dans le pied de page.",
        },
      ],
    },
    {
      heading: "Pourquoi nous les collectons, et notre base légale",
      blocks: [
        {
          kind: "list",
          items: [
            "Pour fournir le service — comptes, pages de créateur, objectifs, actualités et traitement des Tees (*exécution d'un contrat*).",
            "Pour envoyer des e-mails transactionnels — liens de connexion, reçus de soutien et notifications aux créateurs (*contrat / intérêts légitimes*).",
            "Pour assurer la sécurité de la plateforme, prévenir la fraude et les abus, et comprendre l'utilisation du service (*intérêts légitimes*).",
            "Pour respecter les obligations légales, fiscales et de lutte contre le blanchiment d'argent liées aux paiements (*obligation légale*, en grande partie via Stripe).",
          ],
        },
        {
          kind: "paragraph",
          text: "Nous ne vendons pas vos données personnelles.",
        },
      ],
    },
    {
      heading: "Paiements (Stripe)",
      blocks: [
        {
          kind: "paragraph",
          text: "Les paiements reposent sur Stripe, via Stripe Connect. Lorsque vous payez, vos données de carte vont directement à Stripe — BuyMeATee ne les voit ni ne les stocke jamais. Les créateurs qui reçoivent des Tees s'inscrivent auprès de Stripe, qui collecte les informations d'identité et les coordonnées bancaires dont il a besoin pour les vérifier et leur verser les fonds ; Stripe traite ces données en qualité de responsable de traitement indépendant, conformément à sa propre [politique de confidentialité](https://stripe.com/privacy). Nous conservons un enregistrement de chaque Tee (montants, statut, références et message éventuel) pour faire fonctionner le service, afficher la progression et gérer les remboursements et les litiges.",
        },
      ],
    },
    {
      heading: "Qui traite vos données",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous ne partageons des données personnelles qu'avec les prestataires de services qui nous aident à faire fonctionner BuyMeATee :",
        },
        {
          kind: "list",
          items: [
            "**Supabase** — base de données, stockage de fichiers et authentification (hébergés dans l'UE).",
            "**Stripe** — paiements, versements et vérification d'identité.",
            "**Resend** — envoi des e-mails transactionnels.",
            "**Vercel** — hébergement du site web et journaux serveur standard.",
            "**Google Analytics** — statistiques d'utilisation agrégées.",
          ],
        },
        {
          kind: "paragraph",
          text: "Certains de ces prestataires sont établis aux États-Unis ou y traitent des données. Lorsque des données personnelles quittent le Royaume-Uni ou l'EEE, elles sont protégées par des garanties appropriées, telles que des clauses contractuelles types. La liste complète des sous-traitants et les mécanismes de transfert seront confirmés lors de l'examen juridique.",
        },
      ],
    },
    {
      heading: "Combien de temps nous les conservons",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous conservons les données de compte, de profil et de paiement aussi longtemps que vous avez un compte, puis aussi longtemps que les obligations légales, fiscales et comptables l'exigent. Le contenu public que vous publiez reste visible jusqu'à ce que vous le supprimiez ou fermiez votre compte.",
        },
      ],
    },
    {
      heading: "Vos droits",
      blocks: [
        {
          kind: "paragraph",
          text: "En vertu du droit de la protection des données du Royaume-Uni et de l'UE, vous pouvez demander l'accès à vos données personnelles, leur rectification, leur suppression ou leur portabilité, vous opposer à certains traitements ou en demander la limitation, et retirer votre consentement à tout moment. Vous pouvez également adresser une réclamation à votre autorité de protection des données (au Royaume-Uni, l'ICO). Certains enregistrements de paiement et documents fiscaux doivent être conservés même si vous demandez leur suppression.",
        },
      ],
    },
    {
      heading: "Mineurs",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee s'adresse aux adultes (18 ans et plus). Les jeunes golfeurs ne participent que par l'intermédiaire d'un parent ou d'un tuteur approprié, qui est responsable de leur participation.",
        },
      ],
    },
    {
      heading: "Modifications de cette politique",
      blocks: [
        {
          kind: "paragraph",
          text: "Nous mettrons cette politique à jour à mesure que le produit évolue ; la date ci-dessus correspond à la dernière révision. Les modifications substantielles seront mises en évidence avant leur entrée en vigueur.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consultez également nos [conditions d'utilisation](/terms) et notre [FAQ](/faq).",
    },
  ],
};
