import type { LegalDocument } from "./types";

/**
 * Accessibility statement — Portuguese (pt-PT) translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (accessibility.en.ts)
 * governs.
 */
export const accessibilityPt: LegalDocument = {
  title: "Acessibilidade",
  breadcrumbLabel: "Acessibilidade",
  intro:
    "O golfe é para todos, e a BuyMeATee também. Eis como abordamos a acessibilidade — e como nos pode dizer quando ficamos aquém.",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "O nosso compromisso",
      blocks: [
        {
          kind: "paragraph",
          text: "O nosso objetivo é cumprir as [Diretrizes de Acessibilidade para Conteúdo Web (WCAG) 2.2, nível AA](https://www.w3.org/TR/WCAG22/). Quando construímos, a acessibilidade é tratada como parte do «feito», e não como algo deixado para depois, para que qualquer pessoa possa acompanhar o percurso de um golfista e apoiá-lo, independentemente da forma como navega.",
        },
      ],
    },
    {
      heading: "O que fazemos",
      blocks: [
        {
          kind: "list",
          items: [
            "HTML semântico, com uma estrutura de títulos clara e pontos de referência (landmarks).",
            "Uma hiperligação visível para «saltar para o conteúdo» e acesso por teclado a todos os controlos interativos.",
            "Estilos de foco visíveis e controlos que cumprem um tamanho mínimo de área de toque.",
            "Escolhas de cor verificadas quanto ao contraste, sem que o significado seja alguma vez transmitido apenas pela cor.",
            "Alternativas de texto para as imagens com significado e nomes acessíveis para os botões apenas com ícone.",
            "Formulários com etiquetas reais e mensagens de erro e de estado claras e anunciadas.",
            "Disposições que se reorganizam e continuam utilizáveis quando o texto é ampliado.",
          ],
        },
      ],
    },
    {
      heading: "Limitações conhecidas",
      blocks: [
        {
          kind: "paragraph",
          text: "Somos honestos quanto ao trabalho em curso. Algumas áreas — incluindo partes dos fluxos de pagamento e do painel, bem como o conteúdo submetido pelos criadores (imagens, mensagens e hiperligações) — ainda não passaram por uma auditoria independente completa. Os componentes de terceiros, como o checkout alojado pela Stripe, seguem as normas de acessibilidade dos respetivos fornecedores. Corrigimos os problemas à medida que os encontramos e agradecemos que nos sejam comunicados.",
        },
      ],
    },
    {
      heading: "Comunique-nos um problema",
      blocks: [
        {
          kind: "paragraph",
          text: "Se encontrar uma barreira, ou precisar de algo num formato diferente, envie um email para [hello@buymeatee.com](mailto:hello@buymeatee.com). Descreva, por favor, a página, o que estava a tentar fazer e a tecnologia de apoio ou o navegador que estava a utilizar — ajuda-nos a corrigir mais depressa. Procuramos responder no prazo de alguns dias úteis.",
        },
      ],
    },
  ],
};
