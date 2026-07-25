import type { LegalDocument } from "./types";

/**
 * Erklärung zur Barrierefreiheit — German translation of the accessibility
 * statement.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (accessibility.en.ts)
 * governs.
 */
export const accessibilityDe: LegalDocument = {
  title: "Barrierefreiheit",
  breadcrumbLabel: "Barrierefreiheit",
  intro:
    "Golf ist für alle da — und BuyMeATee auch. So gehen wir Barrierefreiheit an, und so erreichen Sie uns, wenn wir hinter diesem Anspruch zurückbleiben.",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "Unser Anspruch",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir orientieren uns an den [Web Content Accessibility Guidelines (WCAG) 2.2, Stufe AA](https://www.w3.org/TR/WCAG22/). Barrierefreiheit gehört bei uns beim Bauen zur Definition von „fertig“ und ist kein nachträglicher Gedanke — damit alle dem Weg eines Golfers oder einer Golferin folgen und ihn oder sie unterstützen können, ganz gleich, wie sie im Netz unterwegs sind.",
        },
      ],
    },
    {
      heading: "Was wir tun",
      blocks: [
        {
          kind: "list",
          items: [
            "Semantisches HTML mit klarer Überschriftenstruktur und Landmarken.",
            "Ein sichtbarer „Zum Inhalt springen“-Link und Tastaturzugang zu jedem interaktiven Bedienelement.",
            "Sichtbare Fokus-Stile und Bedienelemente, die eine Mindestgröße für Touch-Ziele einhalten.",
            "Auf Kontrast geprüfte Farbwahl, wobei Bedeutung nie allein über Farbe transportiert wird.",
            "Textalternativen für bedeutungstragende Bilder und zugängliche Namen für Buttons, die nur ein Icon zeigen.",
            "Formulare mit echten Labels sowie klaren, angekündigten Fehler- und Statusmeldungen.",
            "Layouts, die umfließen und bei vergrößertem Text benutzbar bleiben.",
          ],
        },
      ],
    },
    {
      heading: "Bekannte Einschränkungen",
      blocks: [
        {
          kind: "paragraph",
          text: "Wir sind ehrlich, was noch in Arbeit ist. Einige Bereiche — darunter Teile der Zahlungs- und Dashboard-Abläufe sowie von Creatorn eingereichte Inhalte (Bilder, Nachrichten und Links) — haben noch kein vollständiges unabhängiges Audit durchlaufen. Komponenten von Drittanbietern, etwa der von Stripe gehostete Bezahlvorgang, folgen den Barrierefreiheitsstandards ihrer jeweiligen Anbieter. Wir beheben Probleme, sobald wir sie finden, und freuen uns über Meldungen.",
        },
      ],
    },
    {
      heading: "Melden Sie uns ein Problem",
      blocks: [
        {
          kind: "paragraph",
          text: "Wenn Sie auf eine Barriere stoßen oder etwas in einem anderen Format benötigen, schreiben Sie an [hello@buymeatee.com](mailto:hello@buymeatee.com). Beschreiben Sie bitte die Seite, was Sie tun wollten und welche assistive Technologie oder welchen Browser Sie verwendet haben — das hilft uns, das Problem schneller zu beheben. Wir bemühen uns, innerhalb weniger Werktage zu antworten.",
        },
      ],
    },
  ],
};
