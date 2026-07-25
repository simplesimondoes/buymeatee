import type { LegalDocument } from "./types";

/**
 * Terms of Use — Italian translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (terms.en.ts) governs.
 */
export const termsIt: LegalDocument = {
  title: "Termini di utilizzo",
  breadcrumbLabel: "Termini",
  intro: "Le regole di base per l'utilizzo di BuyMeATee.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Questi termini sono redatti in linguaggio semplice e non sono ancora stati esaminati da un avvocato qualificato. Non costituiscono consulenza legale. Poiché BuyMeATee gestisce pagamenti reali, la loro revisione è prioritaria — insieme allo Stripe Connected Account Agreement.",
  sections: [
    {
      heading: "Che cos'è BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee è una piattaforma dedicata al golf in cui i sostenitori sostengono i creator con un “Tee” — un contributo volontario al percorso golfistico e agli obiettivi di un creator. Noi forniamo la piattaforma ed elaboriamo i pagamenti tramite Stripe; non siamo una banca e non deteniamo il Suo denaro. Utilizzando BuyMeATee, l'utente accetta i presenti termini.",
        },
      ],
    },
    {
      heading: "Chi gestisce BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee è gestita da Simon Berriman, ditta individuale (libero professionista), Karl-Rothe-Str. 4, 04105 Leipzig, Germania. Contatti: [hello@buymeatee.com](mailto:hello@buymeatee.com), +49 15207075439. (Il diritto tedesco può richiedere che questi dati siano presentati come Impressum separato — da confermare in sede di revisione legale.)",
        },
      ],
    },
    {
      heading: "Il Suo account",
      blocks: [
        {
          kind: "list",
          items: [
            "Per creare un account è necessario avere almeno 18 anni.",
            "L'accesso avviene tramite link monouso via e-mail. Mantenga sicuro l'accesso alla Sua casella e-mail — chiunque vi abbia accesso può accedere al Suo account.",
            "L'utente è responsabile dell'attività svolta sul proprio account e dell'accuratezza di ciò che pubblica.",
          ],
        },
      ],
    },
    {
      heading: "Inviare un Tee (sostenitori)",
      blocks: [
        {
          kind: "list",
          items: [
            "Un Tee è un sostegno volontario, non l'acquisto di un prodotto o servizio, e non è un investimento, un prestito né una donazione a un ente di beneficenza registrato. L'utente non riceve alcun bene né alcun rendimento finanziario.",
            "Gli importi mostrati al momento del pagamento comprendono il Tee del creator, la commissione della piattaforma BuyMeATee e i costi stimati di gestione del pagamento. Il totale viene confermato prima del pagamento.",
            "Il pagamento è riscosso da Stripe. I rimborsi sono a discrezione della piattaforma o del creator e vengono gestiti tramite Stripe; in caso di problemi con un Tee, La invitiamo a contattarci.",
            "Non utilizzi BuyMeATee per riciclaggio di denaro, frodi o per inviare fondi che non ha il diritto di inviare.",
          ],
        },
      ],
    },
    {
      heading: "Ricevere Tee (creator)",
      blocks: [
        {
          kind: "list",
          items: [
            "Per ricevere Tee è necessario completare l'onboarding con Stripe e accettare lo [Stripe Connected Account Agreement](https://stripe.com/legal/connect-account). Accrediti, tempistiche e verifiche dell'identità sono disciplinati da Stripe.",
            "BuyMeATee trattiene da ogni Tee una commissione della piattaforma più i costi di gestione del pagamento; il resto viene trasferito sul Suo account collegato. Le commissioni sono mostrate prima che il sostenitore paghi e possono cambiare con preavviso.",
            "L'utente è responsabile di qualsiasi imposta dovuta sul sostegno ricevuto. BuyMeATee non fornisce consulenza fiscale.",
            "Descriva i Suoi obiettivi con onestà. Il sostegno viene dato sulla fiducia; utilizzare obiettivi o aggiornamenti per ingannare i sostenitori costituisce motivo di rimozione.",
          ],
        },
        {
          kind: "note",
          text: "**Status di dilettante — leggere con attenzione.** Accettare denaro o sostegno può incidere sul Suo status di dilettante ai sensi delle Rules of Amateur Status (R&A / USGA) e delle regole del Suo organo di governo, circolo, ateneo o circuito. Queste regole variano e cambiano. È Sua responsabilità verificare la propria posizione prima di ricevere Tee — BuyMeATee non può fornire consulenza sul Suo status di dilettante.",
        },
      ],
    },
    {
      heading: "I Suoi contenuti",
      blocks: [
        {
          kind: "paragraph",
          text: "L'utente conserva la proprietà di ciò che pubblica — profilo, obiettivi, aggiornamenti, immagini e link. L'utente concede a BuyMeATee una licenza per ospitare e mostrare tali contenuti al fine di gestire la piattaforma. Deve avere il diritto di pubblicarli, e i contenuti non devono essere illeciti, lesivi di diritti altrui, ingannevoli, di incitamento all'odio o altrimenti vietati. I link a media in evidenza verso piattaforme di terzi (ad es. YouTube, Instagram) sono soggetti alle condizioni proprie di tali piattaforme.",
        },
      ],
    },
    {
      heading: "Uso consentito e moderazione",
      blocks: [
        {
          kind: "paragraph",
          text: "Non utilizzi BuyMeATee per violare la legge, ledere i diritti altrui, ingannare i sostenitori o abusare del servizio. Possiamo esaminare, rimuovere o ritirare dalla pubblicazione contenuti e sospendere o chiudere account che violano i presenti termini o mettono a rischio sostenitori, creator o la piattaforma.",
        },
      ],
    },
    {
      heading: "Contenuti e accuratezza",
      blocks: [
        {
          kind: "paragraph",
          text: "Lavoriamo per mantenere BuyMeATee onesta: i progressi degli obiettivi riflettono esclusivamente pagamenti confermati, mai cifre digitate a mano. Gli articoli del blog sono informazioni di carattere generale, non consulenza professionale, finanziaria o legale.",
        },
      ],
    },
    {
      heading: "Proprietà intellettuale",
      blocks: [
        {
          kind: "paragraph",
          text: "Il nome BuyMeATee, il marchio e la piattaforma ci appartengono. Può condividere liberamente i link; La preghiamo di non copiare la piattaforma né di spacciare il marchio per proprio.",
        },
      ],
    },
    {
      heading: "Esclusioni di garanzia e responsabilità",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee è fornita così com'è. Facilitiamo il sostegno tra sostenitori e creator, ma non garantiamo la condotta, gli obiettivi o i risultati di alcun creator. Nella misura consentita dalla legge, non accettiamo alcuna responsabilità per il rapporto tra sostenitori e creator né per le decisioni prese utilizzando la piattaforma, e nulla di quanto qui previsto limita i diritti che Le spettano ai sensi della legge applicabile e che non possono essere limitati.",
        },
      ],
    },
    {
      heading: "Modifiche",
      blocks: [
        {
          kind: "paragraph",
          text: "Potremmo aggiornare i presenti termini con lo sviluppo del prodotto. La data indicata sopra riflette l'ultima revisione; le modifiche sostanziali saranno segnalate.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consulti anche la nostra [informativa sulla privacy](/privacy).",
    },
  ],
};
