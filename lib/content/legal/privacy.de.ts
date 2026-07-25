import type { LegalDocument } from "./types";

/**
 * Datenschutzerklärung — German translation of the Privacy Policy.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (privacy.en.ts) governs.
 */
export const privacyDe: LegalDocument = {
  title: "Datenschutzerklärung",
  breadcrumbLabel: "Datenschutz",
  intro:
    "Was wir erheben, warum, wer es verarbeitet und welche Wahlmöglichkeiten Sie haben.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Diese Erklärung beschreibt, was das Produkt tatsächlich tut, wurde aber noch nicht von einer qualifizierten Anwältin, einem qualifizierten Anwalt oder einer Datenschutzberatung geprüft. Sie ist keine Rechtsberatung. Insbesondere die Abschnitte zu Zahlungen, Konten und Analytics benötigen noch die Freigabe durch eine qualifizierte Beratung.",
  sections: [
    {
      heading: "Wer wir sind",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee („wir“, „uns“) ist die Plattform unter buymeatee.com — ein auf Golf ausgerichteter Weg für Unterstützer:innen, Creator mit einem „Tee“ zu unterstützen. Sie wird betrieben von Simon Berriman, Einzelunternehmer mit Sitz in der Karl-Rothe-Str. 4, 04105 Leipzig, Deutschland, der Verantwortlicher für die hier beschriebenen personenbezogenen Daten ist. Für Zahlungen arbeiten wir mit Stripe zusammen; Stripe agiert als eigenständiger Verantwortlicher für die Zahlungs- und Identitätsprüfungsdaten, die es erhebt (siehe „Zahlungen“ unten). Für jedes Datenschutzanliegen kontaktieren Sie [hello@buymeatee.com](mailto:hello@buymeatee.com) oder +49 15207075439. Die vollständigen Betreiberangaben finden Sie in unserem [Impressum](/impressum).",
        },
      ],
    },
    {
      heading: "Was wir erheben",
      blocks: [
        {
          kind: "paragraph",
          text: "**Konten:** Wir verwenden eine passwortlose Anmeldung und speichern daher Ihre E-Mail-Adresse und Anmeldesitzungsdaten. Passwörter speichern wir nie.",
        },
        {
          kind: "paragraph",
          text: "**Creator-Profile:** die Angaben, die Sie selbst veröffentlichen — Anzeigename, Seitenlink (Nutzername), Bio und Über-mich-Text, Foto und Titelbild sowie optionale Golfangaben (Handicap, Ort, Heimatclub, Schlaghand), Social-Media-Links, angepinnte Medien, Ziele und veröffentlichte Updates. Diese Informationen sind bewusst öffentlich.",
        },
        {
          kind: "paragraph",
          text: "**Tees senden oder empfangen:** Wenn Sie ein Tee senden, verarbeiten wir den Betrag, eine optionale Nachricht, den angezeigten Namen (oder „Anonym“, wenn Sie das wählen) und — falls Sie eine angeben — eine E-Mail-Adresse für Ihren Beleg. Kartendaten werden direkt bei Stripe eingegeben und erreichen unsere Server nie. Creator, die Tees empfangen, durchlaufen die Identitäts- und Auszahlungseinrichtung bei Stripe.",
        },
      ],
    },
    {
      heading: "Cookies und Analytics",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir verwenden essenzielle Cookies, um Sie angemeldet zu halten — diese sind immer aktiv, weil die Website sie zum Funktionieren braucht. Außerdem verwenden wir Google Analytics (GA4), um aggregiert zu verstehen, wie die Website genutzt wird; dabei werden Analytics-Cookies gesetzt. Analytics lädt nur, wenn Sie es akzeptieren: Bei Ihrem ersten Besuch fragt ein Banner nach Ihrer Entscheidung, und nichts, was mit Analytics zu tun hat, läuft, bevor Sie einwilligen. Sie können Ihre Entscheidung jederzeit über die **Cookie-Einstellungen** im Footer ändern oder widerrufen.",
        },
      ],
    },
    {
      heading: "Warum wir die Daten erheben und unsere Rechtsgrundlage",
      blocks: [
        {
          kind: "list",
          items: [
            "Um den Dienst bereitzustellen — Konten, Creator-Seiten, Ziele, Updates und die Abwicklung von Tees (*Vertragserfüllung*).",
            "Um Transaktions-E-Mails zu senden — Anmeldelinks, Belege für Unterstützungen und Benachrichtigungen an Creator (*Vertrag / berechtigte Interessen*).",
            "Um die Plattform zu sichern, Betrug und Missbrauch zu verhindern und die Nutzung zu verstehen (*berechtigte Interessen*).",
            "Um rechtliche, steuerliche und geldwäscherechtliche Pflichten rund um Zahlungen zu erfüllen (*rechtliche Verpflichtung*, größtenteils über Stripe).",
          ],
        },
        {
          kind: "paragraph",
          text: "Wir verkaufen Ihre personenbezogenen Daten nicht.",
        },
      ],
    },
    {
      heading: "Zahlungen (Stripe)",
      blocks: [
        {
          kind: "paragraph",
          text: "Zahlungen laufen über Stripe unter Verwendung von Stripe Connect. Wenn Sie zahlen, gehen Ihre Kartendaten direkt an Stripe — BuyMeATee sieht oder speichert sie nie. Creator, die Tees empfangen, durchlaufen das Onboarding bei Stripe; Stripe erhebt dabei die Identitäts- und Bankdaten, die es braucht, um sie zu verifizieren und Auszahlungen vorzunehmen, und verarbeitet diese Daten als eigenständiger Verantwortlicher gemäß seiner eigenen [Datenschutzerklärung](https://stripe.com/privacy). Wir speichern zu jedem Tee einen Datensatz (Beträge, Status, Referenzen und eine etwaige Nachricht), um den Dienst zu betreiben, den Fortschritt anzuzeigen und Erstattungen sowie Zahlungsstreitigkeiten abzuwickeln.",
        },
      ],
    },
    {
      heading: "Wer Ihre Daten verarbeitet",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir geben personenbezogene Daten nur an Dienstleister weiter, die uns beim Betrieb von BuyMeATee unterstützen:",
        },
        {
          kind: "list",
          items: [
            "**Supabase** — Datenbank, Dateispeicher und Authentifizierung (gehostet in der EU).",
            "**Stripe** — Zahlungen, Auszahlungen und Identitätsprüfung.",
            "**Resend** — Versand von Transaktions-E-Mails.",
            "**Vercel** — Website-Hosting und übliche Server-Logs.",
            "**Google Analytics** — aggregierte Nutzungsanalysen.",
          ],
        },
        {
          kind: "paragraph",
          text: "Einige dieser Anbieter haben ihren Sitz in den USA oder verarbeiten Daten dort. Wo personenbezogene Daten das Vereinigte Königreich bzw. den EWR verlassen, werden sie durch geeignete Garantien wie Standardvertragsklauseln geschützt. Die vollständige Liste der Auftragsverarbeiter und die Übermittlungsmechanismen werden in der rechtlichen Prüfung bestätigt.",
        },
      ],
    },
    {
      heading: "Wie lange wir die Daten aufbewahren",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir bewahren Konto-, Profil- und Zahlungsdaten auf, solange Sie ein Konto haben, und danach so lange, wie wir es aus rechtlichen, steuerlichen und buchhalterischen Gründen müssen. Öffentliche Inhalte, die Sie veröffentlichen, bleiben sichtbar, bis Sie sie entfernen oder Ihr Konto schließen.",
        },
      ],
    },
    {
      heading: "Ihre Rechte",
      blocks: [
        {
          kind: "paragraph",
          text: "Nach britischem und EU-Datenschutzrecht können Sie Auskunft über Ihre personenbezogenen Daten sowie deren Berichtigung, Löschung oder Übertragung verlangen, bestimmten Verarbeitungen widersprechen oder deren Einschränkung verlangen und eine Einwilligung jederzeit widerrufen. Sie können sich außerdem bei Ihrer Datenschutzaufsichtsbehörde beschweren (im Vereinigten Königreich beim ICO). Bestimmte Zahlungs- und Steuerunterlagen müssen auch dann aufbewahrt werden, wenn Sie die Löschung verlangen.",
        },
      ],
    },
    {
      heading: "Kinder",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee ist für Erwachsene (ab 18 Jahren). Junior-Golfer:innen nehmen nur über einen geeigneten Elternteil oder Erziehungsberechtigten teil, der für ihre Teilnahme verantwortlich ist.",
        },
      ],
    },
    {
      heading: "Änderungen an dieser Erklärung",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir aktualisieren diese Erklärung, während sich das Produkt weiterentwickelt; das oben genannte Datum gibt die letzte Überarbeitung an. Wesentliche Änderungen werden hervorgehoben, bevor sie wirksam werden.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Siehe auch unsere [Nutzungsbedingungen](/terms) und [FAQ](/faq).",
    },
  ],
};
