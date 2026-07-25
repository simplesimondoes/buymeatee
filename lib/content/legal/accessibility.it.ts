import type { LegalDocument } from "./types";

/**
 * Accessibility statement — Italian translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (accessibility.en.ts)
 * governs.
 */
export const accessibilityIt: LegalDocument = {
  title: "Accessibilità",
  breadcrumbLabel: "Accessibilità",
  intro:
    "Il golf è per tutti, e così anche BuyMeATee. Ecco il nostro approccio all'accessibilità — e come segnalarci quando non siamo all'altezza.",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "Il nostro impegno",
      blocks: [
        {
          kind: "paragraph",
          text: "Puntiamo a rispettare le [Web Content Accessibility Guidelines (WCAG) 2.2, livello AA](https://www.w3.org/TR/WCAG22/). L'accessibilità è considerata parte del lavoro “finito” quando sviluppiamo, non un ripensamento, affinché chiunque possa seguire il percorso di un golfista e sostenerlo, indipendentemente da come naviga.",
        },
      ],
    },
    {
      heading: "Che cosa facciamo",
      blocks: [
        {
          kind: "list",
          items: [
            "HTML semantico con una struttura di intestazioni chiara e landmark.",
            "Un link “salta al contenuto” visibile e accesso da tastiera a ogni controllo interattivo.",
            "Stili di focus visibili e controlli che rispettano una dimensione minima dell'area di tocco.",
            "Scelte cromatiche verificate per il contrasto, senza che il significato sia mai affidato al solo colore.",
            "Alternative testuali per le immagini significative e nomi accessibili per i pulsanti con la sola icona.",
            "Moduli con etichette reali e messaggi di errore e di stato chiari e annunciati.",
            "Layout che si riorganizzano e restano utilizzabili quando il testo viene ingrandito.",
          ],
        },
      ],
    },
    {
      heading: "Limitazioni note",
      blocks: [
        {
          kind: "paragraph",
          text: "Siamo onesti sul lavoro ancora in corso. Alcune aree — comprese parti dei flussi di pagamento e del dashboard, e i contenuti caricati dai creator (immagini, messaggi e link) — non sono ancora passate per un audit indipendente completo. I componenti di terzi, come il checkout ospitato da Stripe, seguono gli standard di accessibilità dei rispettivi fornitori. Correggiamo i problemi man mano che li individuiamo e accogliamo con favore le segnalazioni.",
        },
      ],
    },
    {
      heading: "Ci segnali un problema",
      blocks: [
        {
          kind: "paragraph",
          text: "Se incontra una barriera, o ha bisogno di qualcosa in un formato diverso, scriva a [hello@buymeatee.com](mailto:hello@buymeatee.com). La preghiamo di descrivere la pagina, che cosa stava cercando di fare e la tecnologia assistiva o il browser che stava utilizzando — ci aiuta a risolvere più in fretta. Puntiamo a rispondere entro pochi giorni lavorativi.",
        },
      ],
    },
  ],
};
