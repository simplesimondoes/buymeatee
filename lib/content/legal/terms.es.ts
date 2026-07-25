import type { LegalDocument } from "./types";

/**
 * Terms of Use — Spanish translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (terms.en.ts) governs.
 */
export const termsEs: LegalDocument = {
  title: "Términos de uso",
  breadcrumbLabel: "Términos",
  intro: "Las reglas básicas para usar BuyMeATee.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Estos términos están redactados en lenguaje claro y todavía no han sido revisados por un abogado cualificado. No constituyen asesoramiento jurídico. Dado que BuyMeATee gestiona pagos reales, deben revisarse con carácter prioritario — junto con el Stripe Connected Account Agreement.",
  sections: [
    {
      heading: "Qué es BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee es una plataforma centrada en el golf en la que quienes apoyan respaldan a creadores con un «Tee»: una aportación voluntaria destinada al camino golfístico y a los objetivos de un creador. Nosotros proporcionamos la plataforma y procesamos los pagos a través de Stripe; no somos un banco y no custodiamos su dinero. Al usar BuyMeATee, usted acepta estos términos.",
        },
      ],
    },
    {
      heading: "Quién opera BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee es operada por Simon Berriman, empresario individual (autónomo), Karl-Rothe-Str. 4, 04105 Leipzig, Alemania. Contacto: [hello@buymeatee.com](mailto:hello@buymeatee.com), +49 15207075439. (La legislación alemana puede exigir que estos datos se presenten como un Impressum separado — pendiente de confirmar en la revisión jurídica.)",
        },
      ],
    },
    {
      heading: "Su cuenta",
      blocks: [
        {
          kind: "list",
          items: [
            "Debe tener al menos 18 años para crear una cuenta.",
            "El inicio de sesión se realiza mediante un enlace de un solo uso enviado por correo electrónico. Mantenga seguro el acceso a su correo electrónico: cualquiera que lo tenga puede acceder a su cuenta.",
            "Usted es responsable de la actividad de su cuenta y de la exactitud de lo que publica.",
          ],
        },
      ],
    },
    {
      heading: "Enviar un Tee (quienes apoyan)",
      blocks: [
        {
          kind: "list",
          items: [
            "Un Tee es apoyo voluntario, no la compra de un producto o servicio, y no es una inversión, un préstamo ni una donación a una entidad benéfica registrada. Usted no recibe bienes ni rendimiento financiero alguno.",
            "Los importes mostrados en el proceso de pago incluyen el Tee del creador más la comisión de la plataforma BuyMeATee y los gastos de procesamiento del pago estimados. El total se confirma antes de que usted pague.",
            "El cobro lo realiza Stripe. Los reembolsos quedan a discreción de la plataforma o del creador y se gestionan a través de Stripe; contacte con nosotros si hay algún problema con un Tee.",
            "No use BuyMeATee para blanqueo de capitales, fraude, ni para enviar fondos que no tenga derecho a enviar.",
          ],
        },
      ],
    },
    {
      heading: "Recibir Tees (creadores)",
      blocks: [
        {
          kind: "list",
          items: [
            "Para recibir Tees debe completar el alta con Stripe y aceptar el [Stripe Connected Account Agreement](https://stripe.com/legal/connect-account). Los pagos, sus plazos y las verificaciones de identidad se rigen por Stripe.",
            "BuyMeATee retiene de cada Tee una comisión de la plataforma más los gastos de procesamiento del pago; el resto se transfiere a su cuenta conectada. Las comisiones se muestran antes de que quien apoya pague y pueden cambiar previo aviso.",
            "Usted es responsable de cualquier impuesto que deba por el apoyo que recibe. BuyMeATee no proporciona asesoramiento fiscal.",
            "Describa sus objetivos con honestidad. El apoyo se otorga sobre la base de la confianza; usar los objetivos o las novedades para inducir a error a quienes apoyan es motivo de expulsión.",
          ],
        },
        {
          kind: "note",
          text: "**Estatus amateur — lea esto.** Aceptar dinero o apoyo puede afectar a su estatus amateur conforme a las Reglas del Estatus de Aficionado (R&A / USGA) y a las normas de su órgano rector, club, universidad o circuito. Estas normas varían y cambian. Es su responsabilidad comprobar su propia situación antes de recibir Tees — BuyMeATee no puede asesorarle sobre su estatus amateur.",
        },
      ],
    },
    {
      heading: "Su contenido",
      blocks: [
        {
          kind: "paragraph",
          text: "Usted conserva la propiedad de lo que publica: su perfil, objetivos, novedades, imágenes y enlaces. Usted concede a BuyMeATee una licencia para alojar y mostrar ese contenido con el fin de operar la plataforma. Debe tener derecho a publicarlo, y no puede ser ilícito, infractor de derechos, engañoso, de odio ni prohibido por cualquier otro motivo. Los enlaces de contenido destacado a plataformas de terceros (p. ej. YouTube, Instagram) están sujetos a las condiciones propias de esas plataformas.",
        },
      ],
    },
    {
      heading: "Uso aceptable y moderación",
      blocks: [
        {
          kind: "paragraph",
          text: "No use BuyMeATee para infringir la ley, vulnerar los derechos de otros, engañar a quienes apoyan o abusar del servicio. Podemos revisar, retirar o despublicar contenido y suspender o cerrar cuentas que incumplan estos términos o pongan en riesgo a quienes apoyan, a los creadores o a la plataforma.",
        },
      ],
    },
    {
      heading: "Contenido y exactitud",
      blocks: [
        {
          kind: "paragraph",
          text: "Trabajamos para mantener BuyMeATee honesta: el progreso de los objetivos refleja únicamente pagos confirmados, nunca cifras introducidas a mano. Los artículos del blog son información general, no asesoramiento profesional, financiero ni jurídico.",
        },
      ],
    },
    {
      heading: "Propiedad intelectual",
      blocks: [
        {
          kind: "paragraph",
          text: "El nombre, la marca y la plataforma BuyMeATee nos pertenecen. Puede compartir enlaces libremente; por favor, no copie la plataforma ni haga pasar la marca por propia.",
        },
      ],
    },
    {
      heading: "Exenciones de responsabilidad y responsabilidad",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee se proporciona «tal cual». Facilitamos el apoyo entre quienes apoyan y los creadores, pero no garantizamos la conducta, los objetivos ni los resultados de ningún creador. En la medida en que la ley lo permita, no aceptamos responsabilidad alguna por la relación entre quienes apoyan y los creadores ni por las decisiones tomadas usando la plataforma, y nada de lo aquí dispuesto limita los derechos que la legislación aplicable le reconozca y que no puedan limitarse.",
        },
      ],
    },
    {
      heading: "Cambios",
      blocks: [
        {
          kind: "paragraph",
          text: "Podemos actualizar estos términos a medida que el producto evoluciona. La fecha indicada arriba refleja la última revisión; los cambios sustanciales se señalarán.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consulte también nuestra [política de privacidad](/privacy).",
    },
  ],
};
