import type { LegalDocument } from "./types";

/**
 * Privacy Policy — Spanish translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 *
 * Convenience translation — the English version (privacy.en.ts) governs.
 */
export const privacyEs: LegalDocument = {
  title: "Política de privacidad",
  breadcrumbLabel: "Privacidad",
  intro:
    "Qué recogemos, por qué, quién lo trata y las opciones de las que dispone.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Esta política describe lo que el producto hace realmente, pero todavía no ha sido revisada por un abogado cualificado ni por un asesor de protección de datos. No constituye asesoramiento jurídico. Las secciones de pagos, cuentas y analítica, en particular, aún necesitan la aprobación de un asesor cualificado.",
  sections: [
    {
      heading: "Quiénes somos",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee («nosotros») es la plataforma de buymeatee.com — una forma centrada en el golf de que quienes apoyan respalden a creadores con un «Tee». Es operada por Simon Berriman, empresario individual con domicilio en Karl-Rothe-Str. 4, 04105 Leipzig, Alemania, que es el responsable del tratamiento de los datos personales aquí descritos. Para los pagos trabajamos con Stripe, que actúa como responsable independiente respecto de los datos de pago y de verificación de identidad que recoge (véase «Pagos» más abajo). Para cualquier solicitud relativa a la privacidad, contacte con [hello@buymeatee.com](mailto:hello@buymeatee.com) o el +49 15207075439. Los datos completos del operador figuran en nuestro [Impressum](/impressum).",
        },
      ],
    },
    {
      heading: "Qué recogemos",
      blocks: [
        {
          kind: "paragraph",
          text: "**Cuentas:** usamos inicio de sesión sin contraseña, por lo que conservamos su dirección de correo electrónico y los datos de sesión de inicio. Nunca almacenamos contraseñas.",
        },
        {
          kind: "paragraph",
          text: "**Perfiles de creador:** los datos que usted decide publicar — nombre visible, enlace de la página (nombre de usuario), biografía y texto «Acerca de», foto e imagen de portada, y detalles de golf opcionales (hándicap, ubicación, club de origen, lateralidad), enlaces a redes sociales, contenido destacado, objetivos y novedades publicadas. Esta información es pública por diseño.",
        },
        {
          kind: "paragraph",
          text: "**Enviar o recibir Tees:** cuando usted envía un Tee gestionamos el importe, un mensaje opcional, el nombre que se muestra (o «Anónimo» si así lo elige) y — si lo facilita — un correo electrónico para su recibo. Los datos de la tarjeta se introducen directamente en Stripe y nunca llegan a nuestros servidores. Los creadores que reciben Tees completan la verificación de identidad y la configuración de pagos con Stripe.",
        },
      ],
    },
    {
      heading: "Cookies y analítica",
      blocks: [
        {
          kind: "paragraph",
          text: "Usamos cookies esenciales para mantener su sesión iniciada — están siempre activas porque el sitio las necesita para funcionar. También usamos Google Analytics (GA4) para entender, de forma agregada, cómo se usa el sitio, lo que instala cookies de analítica. La analítica solo se carga si usted la acepta: en su primera visita, un aviso le pide su elección, y nada relacionado con la analítica se ejecuta hasta que usted da su consentimiento. Puede cambiar o retirar su elección en cualquier momento a través de **Configuración de cookies** en el pie de página.",
        },
      ],
    },
    {
      heading: "Por qué lo recogemos, y nuestra base jurídica",
      blocks: [
        {
          kind: "list",
          items: [
            "Para prestar el servicio — cuentas, páginas de creador, objetivos, novedades y procesamiento de Tees (*ejecución de un contrato*).",
            "Para enviar correos electrónicos transaccionales — enlaces de inicio de sesión, recibos de aportaciones y notificaciones a creadores (*contrato / interés legítimo*).",
            "Para mantener la plataforma segura, prevenir el fraude y el abuso, y entender el uso (*interés legítimo*).",
            "Para cumplir las obligaciones legales, fiscales y de prevención del blanqueo de capitales en torno a los pagos (*obligación legal*, en gran medida a través de Stripe).",
          ],
        },
        {
          kind: "paragraph",
          text: "No vendemos sus datos personales.",
        },
      ],
    },
    {
      heading: "Pagos (Stripe)",
      blocks: [
        {
          kind: "paragraph",
          text: "Los pagos funcionan sobre Stripe mediante Stripe Connect. Cuando usted paga, los datos de su tarjeta van directamente a Stripe — BuyMeATee nunca los ve ni los almacena. Los creadores que reciben Tees se dan de alta en Stripe, que recoge los datos de identidad y bancarios que necesita para verificarlos y pagarles; Stripe trata esos datos como responsable independiente conforme a su propia [política de privacidad](https://stripe.com/privacy). Nosotros guardamos un registro de cada Tee (importes, estado, referencias y cualquier mensaje) para operar el servicio, mostrar el progreso y gestionar reembolsos y disputas.",
        },
      ],
    },
    {
      heading: "Quién trata sus datos",
      blocks: [
        {
          kind: "paragraph",
          text: "Compartimos datos personales únicamente con proveedores de servicios que nos ayudan a operar BuyMeATee:",
        },
        {
          kind: "list",
          items: [
            "**Supabase** — base de datos, almacenamiento de archivos y autenticación (alojado en la UE).",
            "**Stripe** — pagos, transferencias y verificación de identidad.",
            "**Resend** — envío de correo electrónico transaccional.",
            "**Vercel** — alojamiento del sitio web y registros estándar del servidor.",
            "**Google Analytics** — analítica de uso agregada.",
          ],
        },
        {
          kind: "paragraph",
          text: "Algunos de estos proveedores están establecidos en Estados Unidos o tratan datos allí. Cuando los datos personales salen del Reino Unido/EEE, quedan protegidos por garantías adecuadas, como las Cláusulas Contractuales Tipo. La lista completa de encargados del tratamiento y los mecanismos de transferencia se confirmarán en la revisión jurídica.",
        },
      ],
    },
    {
      heading: "Cuánto tiempo los conservamos",
      blocks: [
        {
          kind: "paragraph",
          text: "Conservamos los registros de cuentas, perfiles y pagos mientras usted tenga una cuenta y, después, durante el tiempo que estemos obligados por motivos legales, fiscales y contables. El contenido público que usted publica permanece visible hasta que lo retire o cierre su cuenta.",
        },
      ],
    },
    {
      heading: "Sus derechos",
      blocks: [
        {
          kind: "paragraph",
          text: "Conforme a la legislación de protección de datos del Reino Unido y de la UE, usted puede solicitar el acceso, la rectificación, la supresión o la portabilidad de sus datos personales, oponerse a determinados tratamientos o restringirlos, y retirar su consentimiento en cualquier momento. También puede presentar una reclamación ante su autoridad de protección de datos (en el Reino Unido, la ICO). Algunos registros de pagos y fiscales deben conservarse aunque usted solicite su supresión.",
        },
      ],
    },
    {
      heading: "Menores",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee es para adultos (mayores de 18 años). Los golfistas juveniles participan únicamente a través de un padre, madre o tutor adecuado, que es responsable de su participación.",
        },
      ],
    },
    {
      heading: "Cambios en esta política",
      blocks: [
        {
          kind: "paragraph",
          text: "Actualizaremos esta política a medida que el producto evolucione; la fecha indicada arriba refleja la última revisión. Los cambios sustanciales se destacarán antes de que surtan efecto.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consulte también nuestros [términos](/terms) y las [preguntas frecuentes](/faq).",
    },
  ],
};
