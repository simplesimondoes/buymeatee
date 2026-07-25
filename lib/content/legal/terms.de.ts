import type { LegalDocument } from "./types";

/**
 * Nutzungsbedingungen — German translation of the Terms of Use.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (terms.en.ts) governs.
 */
export const termsDe: LegalDocument = {
  title: "Nutzungsbedingungen",
  breadcrumbLabel: "Nutzungsbedingungen",
  intro: "Die Grundregeln für die Nutzung von BuyMeATee.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Diese Nutzungsbedingungen sind in einfacher Sprache verfasst und wurden noch nicht von einer qualifizierten Anwältin oder einem qualifizierten Anwalt geprüft. Sie sind keine Rechtsberatung. Da BuyMeATee echte Zahlungen abwickelt, müssen sie vorrangig geprüft werden — gemeinsam mit dem Stripe Connected Account Agreement.",
  sections: [
    {
      heading: "Was BuyMeATee ist",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee ist eine auf Golf ausgerichtete Plattform, auf der Unterstützer:innen Creator mit einem „Tee“ unterstützen — einem freiwilligen Beitrag zum Golfweg und zu den Zielen eines Creators. Wir stellen die Plattform bereit und wickeln Zahlungen über Stripe ab; wir sind keine Bank und verwahren Ihr Geld nicht. Mit der Nutzung von BuyMeATee erklären Sie sich mit diesen Bedingungen einverstanden.",
        },
      ],
    },
    {
      heading: "Wer BuyMeATee betreibt",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee wird betrieben von Simon Berriman, Einzelunternehmer (freiberuflich), Karl-Rothe-Str. 4, 04105 Leipzig, Deutschland. Kontakt: [hello@buymeatee.com](mailto:hello@buymeatee.com), +49 15207075439. (Nach deutschem Recht müssen diese Angaben möglicherweise als separates Impressum dargestellt werden — dies wird in der rechtlichen Prüfung geklärt.)",
        },
      ],
    },
    {
      heading: "Ihr Konto",
      blocks: [
        {
          kind: "list",
          items: [
            "Sie müssen mindestens 18 Jahre alt sein, um ein Konto zu erstellen.",
            "Die Anmeldung erfolgt über einen einmaligen E-Mail-Link. Sichern Sie den Zugang zu Ihrem E-Mail-Postfach — wer darauf Zugriff hat, kann auf Ihr Konto zugreifen.",
            "Sie sind für die Aktivitäten in Ihrem Konto und für die Richtigkeit dessen, was Sie veröffentlichen, verantwortlich.",
          ],
        },
      ],
    },
    {
      heading: "Ein Tee senden (Unterstützer:innen)",
      blocks: [
        {
          kind: "list",
          items: [
            "Ein Tee ist freiwillige Unterstützung — kein Kauf eines Produkts oder einer Dienstleistung und weder ein Investment noch ein Darlehen oder eine Spende an eine eingetragene gemeinnützige Organisation. Sie erhalten keine Waren und keine finanzielle Rendite.",
            "Die beim Bezahlvorgang angezeigten Beträge umfassen das Tee für den Creator zuzüglich der BuyMeATee-Plattformgebühr und der geschätzten Kosten der Zahlungsabwicklung. Der Gesamtbetrag wird bestätigt, bevor Sie zahlen.",
            "Die Zahlung wird von Stripe eingezogen. Erstattungen liegen im Ermessen der Plattform oder des Creators und werden über Stripe abgewickelt; kontaktieren Sie uns, wenn es ein Problem mit einem Tee gibt.",
            "Nutzen Sie BuyMeATee nicht für Geldwäsche oder Betrug und nicht, um Gelder zu senden, zu deren Versand Sie nicht berechtigt sind.",
          ],
        },
      ],
    },
    {
      heading: "Tees empfangen (Creator)",
      blocks: [
        {
          kind: "list",
          items: [
            "Um Tees zu empfangen, müssen Sie das Onboarding bei Stripe abschließen und das [Stripe Connected Account Agreement](https://stripe.com/legal/connect-account) akzeptieren. Auszahlungen, deren Zeitpunkt und Identitätsprüfungen richten sich nach Stripe.",
            "BuyMeATee behält von jedem Tee eine Plattformgebühr zuzüglich der Kosten der Zahlungsabwicklung ein; der Rest wird auf Ihr verbundenes Konto übertragen. Die Gebühren werden angezeigt, bevor Unterstützer:innen zahlen, und können mit Ankündigung geändert werden.",
            "Sie sind für alle Steuern verantwortlich, die auf von Ihnen erhaltene Unterstützung anfallen. BuyMeATee bietet keine Steuerberatung.",
            "Beschreiben Sie Ihre Ziele ehrlich. Unterstützung wird im Vertrauen gegeben; wer Ziele oder Updates nutzt, um Unterstützer:innen in die Irre zu führen, kann von der Plattform entfernt werden.",
          ],
        },
        {
          kind: "note",
          text: "**Amateurstatus — bitte lesen.** Die Annahme von Geld oder Unterstützung kann Ihren Amateurstatus nach den Rules of Amateur Status (R&A / USGA) sowie nach den Regeln Ihres Verbands, Clubs, Colleges oder Ihrer Tour beeinträchtigen. Diese Regeln unterscheiden sich und ändern sich. Es liegt in Ihrer Verantwortung, Ihre eigene Situation zu prüfen, bevor Sie Tees empfangen — BuyMeATee kann Sie zu Ihrem Amateurstatus nicht beraten.",
        },
      ],
    },
    {
      heading: "Ihre Inhalte",
      blocks: [
        {
          kind: "paragraph",
          text: "Was Sie veröffentlichen, bleibt Ihr Eigentum — Ihr Profil, Ihre Ziele, Updates, Bilder und Links. Sie räumen BuyMeATee eine Lizenz ein, diese Inhalte zu hosten und anzuzeigen, um die Plattform zu betreiben. Sie müssen zur Veröffentlichung berechtigt sein, und die Inhalte dürfen nicht rechtswidrig, rechtsverletzend, irreführend, hasserfüllt oder anderweitig unzulässig sein. Angepinnte Medienlinks zu Drittplattformen (z. B. YouTube, Instagram) unterliegen den eigenen Bedingungen dieser Plattformen.",
        },
      ],
    },
    {
      heading: "Zulässige Nutzung und Moderation",
      blocks: [
        {
          kind: "paragraph",
          text: "Nutzen Sie BuyMeATee nicht, um gegen Gesetze zu verstoßen, Rechte anderer zu verletzen, Unterstützer:innen zu täuschen oder den Dienst zu missbrauchen. Wir können Inhalte prüfen, entfernen oder depublizieren sowie Konten sperren oder schließen, die gegen diese Bedingungen verstoßen oder Unterstützer:innen, Creator oder die Plattform gefährden.",
        },
      ],
    },
    {
      heading: "Inhalte und Richtigkeit",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir arbeiten daran, BuyMeATee ehrlich zu halten: Der Zielfortschritt spiegelt ausschließlich bestätigte Zahlungen wider, niemals eingetippte Zahlen. Blogartikel sind allgemeine Informationen und keine professionelle, finanzielle oder rechtliche Beratung.",
        },
      ],
    },
    {
      heading: "Geistiges Eigentum",
      blocks: [
        {
          kind: "paragraph",
          text: "Der Name BuyMeATee, die Marke und die Plattform gehören uns. Sie dürfen Links frei teilen; bitte kopieren Sie die Plattform nicht und geben Sie die Marke nicht als Ihre eigene aus.",
        },
      ],
    },
    {
      heading: "Haftungsausschlüsse und Haftung",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee wird ohne Gewähr („as is“) bereitgestellt. Wir vermitteln Unterstützung zwischen Unterstützer:innen und Creatorn, garantieren aber weder das Verhalten noch die Ziele oder Ergebnisse eines Creators. Soweit gesetzlich zulässig, übernehmen wir keine Haftung für die Beziehung zwischen Unterstützer:innen und Creatorn oder für Entscheidungen, die unter Nutzung der Plattform getroffen werden; nichts in diesen Bedingungen beschränkt Rechte, die Ihnen nach anwendbarem Recht zustehen und nicht beschränkt werden können.",
        },
      ],
    },
    {
      heading: "Änderungen",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir können diese Bedingungen aktualisieren, während sich das Produkt weiterentwickelt. Das oben genannte Datum gibt die letzte Überarbeitung an; auf wesentliche Änderungen wird hingewiesen.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Siehe auch unsere [Datenschutzerklärung](/privacy).",
    },
  ],
};
