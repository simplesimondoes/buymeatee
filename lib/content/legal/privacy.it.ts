import type { LegalDocument } from "./types";

/**
 * Privacy Policy — Italian translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (privacy.en.ts) governs.
 */
export const privacyIt: LegalDocument = {
  title: "Informativa sulla privacy",
  breadcrumbLabel: "Privacy",
  intro:
    "Che cosa raccogliamo, perché, chi tratta i dati e le scelte a Sua disposizione.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Questa informativa descrive ciò che il prodotto fa realmente, ma non è ancora stata esaminata da un avvocato qualificato o da un consulente per la protezione dei dati. Non costituisce consulenza legale. In particolare, le sezioni su pagamenti, account e analytics necessitano ancora dell'approvazione di un consulente qualificato.",
  sections: [
    {
      heading: "Chi siamo",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee (“noi”) è la piattaforma raggiungibile su buymeatee.com — un modo dedicato al golf con cui i sostenitori sostengono i creator con un “Tee”. È gestita da Simon Berriman, ditta individuale con sede in Karl-Rothe-Str. 4, 04105 Leipzig, Germania, che è il titolare del trattamento per i dati personali descritti in questa informativa. Per i pagamenti collaboriamo con Stripe, che agisce come titolare autonomo del trattamento per i dati di pagamento e di verifica dell'identità che raccoglie (si veda “Pagamenti” più avanti). Per qualsiasi richiesta relativa alla privacy, contatti [hello@buymeatee.com](mailto:hello@buymeatee.com) o +49 15207075439. I dati completi del gestore sono nel nostro [Impressum](/impressum).",
        },
      ],
    },
    {
      heading: "Che cosa raccogliamo",
      blocks: [
        {
          kind: "paragraph",
          text: "**Account:** utilizziamo l'accesso senza password, quindi conserviamo il Suo indirizzo e-mail e i dati di sessione di accesso. Non memorizziamo mai password.",
        },
        {
          kind: "paragraph",
          text: "**Profili dei creator:** i dettagli che sceglie di pubblicare — nome visualizzato, link della pagina (nome utente), bio e testo di presentazione, foto e immagine di copertina, dettagli golfistici facoltativi (handicap, località, circolo di appartenenza, lateralità), link ai social, media in evidenza, obiettivi e aggiornamenti pubblicati. Queste informazioni sono pubbliche per loro natura.",
        },
        {
          kind: "paragraph",
          text: "**Inviare o ricevere Tee:** quando invia un Tee trattiamo l'importo, un messaggio facoltativo, il nome mostrato (o “Anonimo” se lo sceglie) e — se lo fornisce — un indirizzo e-mail per la ricevuta. I dati della carta sono inseriti direttamente presso Stripe e non raggiungono mai i nostri server. I creator che ricevono Tee completano con Stripe la configurazione dell'identità e degli accrediti.",
        },
      ],
    },
    {
      heading: "Cookie e analytics",
      blocks: [
        {
          kind: "paragraph",
          text: "Utilizziamo cookie essenziali per mantenere attivo il Suo accesso — sono sempre attivi perché il sito ne ha bisogno per funzionare. Utilizziamo inoltre Google Analytics (GA4) per capire, in forma aggregata, come viene usato il sito, il che imposta cookie di analytics. Gli analytics si caricano solo se li accetta: alla prima visita un banner Le chiede di scegliere, e nulla di relativo agli analytics viene eseguito finché non presta il consenso. Può modificare o revocare la Sua scelta in qualsiasi momento tramite **Impostazioni cookie** nel piè di pagina.",
        },
      ],
    },
    {
      heading: "Perché li raccogliamo, e la nostra base giuridica",
      blocks: [
        {
          kind: "list",
          items: [
            "Per fornire il servizio — account, pagine dei creator, obiettivi, aggiornamenti ed elaborazione dei Tee (*esecuzione di un contratto*).",
            "Per inviare e-mail transazionali — link di accesso, ricevute dei contributi e notifiche ai creator (*contratto / legittimo interesse*).",
            "Per mantenere la piattaforma sicura, prevenire frodi e abusi e comprendere l'utilizzo (*legittimo interesse*).",
            "Per adempiere agli obblighi legali, fiscali e antiriciclaggio connessi ai pagamenti (*obbligo legale*, in gran parte tramite Stripe).",
          ],
        },
        {
          kind: "paragraph",
          text: "Non vendiamo i Suoi dati personali.",
        },
      ],
    },
    {
      heading: "Pagamenti (Stripe)",
      blocks: [
        {
          kind: "paragraph",
          text: "I pagamenti sono gestiti da Stripe tramite Stripe Connect. Quando paga, i dati della Sua carta vanno direttamente a Stripe — BuyMeATee non li vede né li memorizza mai. I creator che ricevono Tee completano l'onboarding con Stripe, che raccoglie i dati identificativi e bancari necessari per verificarli ed effettuare gli accrediti; Stripe tratta tali dati come titolare autonomo del trattamento ai sensi della propria [informativa sulla privacy](https://stripe.com/privacy). Conserviamo una registrazione di ciascun Tee (importi, stato, riferimenti ed eventuale messaggio) per gestire il servizio, mostrare i progressi e gestire rimborsi e contestazioni.",
        },
      ],
    },
    {
      heading: "Chi tratta i Suoi dati",
      blocks: [
        {
          kind: "paragraph",
          text: "Condividiamo i dati personali soltanto con i fornitori di servizi che ci aiutano a gestire BuyMeATee:",
        },
        {
          kind: "list",
          items: [
            "**Supabase** — database, archiviazione di file e autenticazione (con hosting nell'UE).",
            "**Stripe** — pagamenti, accrediti e verifica dell'identità.",
            "**Resend** — invio di e-mail transazionali.",
            "**Vercel** — hosting del sito web e log standard del server.",
            "**Google Analytics** — statistiche di utilizzo in forma aggregata.",
          ],
        },
        {
          kind: "paragraph",
          text: "Alcuni di questi fornitori hanno sede negli Stati Uniti o vi trattano dati. Laddove i dati personali lasciano il Regno Unito/SEE, sono protetti da garanzie adeguate quali le Clausole Contrattuali Standard. L'elenco completo dei responsabili del trattamento e i meccanismi di trasferimento saranno confermati in sede di revisione legale.",
        },
      ],
    },
    {
      heading: "Per quanto tempo li conserviamo",
      blocks: [
        {
          kind: "paragraph",
          text: "Conserviamo i dati relativi ad account, profili e pagamenti per tutta la durata del Suo account e, successivamente, per il tempo richiesto da obblighi legali, fiscali e contabili. I contenuti pubblici che pubblica restano visibili finché non li rimuove o non chiude il Suo account.",
        },
      ],
    },
    {
      heading: "I Suoi diritti",
      blocks: [
        {
          kind: "paragraph",
          text: "Ai sensi della normativa sulla protezione dei dati del Regno Unito e dell'UE, può chiedere di accedere ai Suoi dati personali, rettificarli, cancellarli o esportarli, opporsi a determinati trattamenti o limitarli, e revocare il consenso in qualsiasi momento. Può inoltre presentare reclamo alla Sua autorità di controllo per la protezione dei dati (nel Regno Unito, l'ICO). Alcune registrazioni relative a pagamenti e imposte devono essere conservate anche se ne chiede la cancellazione.",
        },
      ],
    },
    {
      heading: "Minori",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee è riservata agli adulti (18+). I golfisti juniores partecipano soltanto tramite un genitore o tutore idoneo, che è responsabile della loro partecipazione.",
        },
      ],
    },
    {
      heading: "Modifiche a questa informativa",
      blocks: [
        {
          kind: "paragraph",
          text: "Aggiorneremo questa informativa con l'evolversi del prodotto; la data indicata sopra riflette l'ultima revisione. Le modifiche sostanziali saranno evidenziate prima della loro entrata in vigore.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consulti anche i nostri [termini](/terms) e le [FAQ](/faq).",
    },
  ],
};
