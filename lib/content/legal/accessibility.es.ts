import type { LegalDocument } from "./types";

/**
 * Accessibility statement — Spanish translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (accessibility.en.ts)
 * governs.
 */
export const accessibilityEs: LegalDocument = {
  title: "Accesibilidad",
  breadcrumbLabel: "Accesibilidad",
  intro:
    "El golf es para todos, y BuyMeATee también. Así abordamos la accesibilidad — y así puede avisarnos cuando nos quedamos cortos.",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "Nuestro compromiso",
      blocks: [
        {
          kind: "paragraph",
          text: "Aspiramos a cumplir las [Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA](https://www.w3.org/TR/WCAG22/). La accesibilidad se trata como parte de lo «terminado» cuando construimos, no como una ocurrencia tardía, para que cualquiera pueda seguir el camino de un golfista y apoyarle, sea cual sea su forma de navegar.",
        },
      ],
    },
    {
      heading: "Qué hacemos",
      blocks: [
        {
          kind: "list",
          items: [
            "HTML semántico con una estructura de encabezados clara y regiones (landmarks).",
            "Un enlace visible de «saltar al contenido» y acceso por teclado a todos los controles interactivos.",
            "Estilos de foco visibles y controles que cumplen un tamaño mínimo de área táctil.",
            "Elecciones de color verificadas en cuanto a contraste, sin que el significado dependa nunca solo del color.",
            "Alternativas de texto para las imágenes con significado y nombres accesibles para los botones de solo icono.",
            "Formularios con etiquetas reales y mensajes de error y de estado claros y anunciados.",
            "Diseños que se reorganizan y siguen siendo usables cuando se amplía el texto.",
          ],
        },
      ],
    },
    {
      heading: "Limitaciones conocidas",
      blocks: [
        {
          kind: "paragraph",
          text: "Somos honestos sobre el trabajo en curso. Algunas áreas — incluidas partes de los flujos de pago y del panel, así como el contenido enviado por los creadores (imágenes, mensajes y enlaces) — aún no han pasado por una auditoría independiente completa. Los componentes de terceros, como el proceso de pago alojado por Stripe, siguen las normas de accesibilidad de sus propios proveedores. Corregimos los problemas a medida que los encontramos y agradecemos que nos los comuniquen.",
        },
      ],
    },
    {
      heading: "Comuníquenos un problema",
      blocks: [
        {
          kind: "paragraph",
          text: "Si se encuentra con una barrera, o necesita algo en un formato distinto, escriba a [hello@buymeatee.com](mailto:hello@buymeatee.com). Por favor, describa la página, lo que intentaba hacer y la tecnología de apoyo o el navegador que estaba usando — nos ayuda a corregirlo más rápido. Nuestro objetivo es responder en unos pocos días laborables.",
        },
      ],
    },
  ],
};
