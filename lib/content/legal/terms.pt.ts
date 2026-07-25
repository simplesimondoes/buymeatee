import type { LegalDocument } from "./types";

/**
 * Terms of Use — Portuguese (pt-PT) translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (terms.en.ts) governs.
 */
export const termsPt: LegalDocument = {
  title: "Termos de utilização",
  breadcrumbLabel: "Termos",
  intro: "As regras de base para utilizar a BuyMeATee.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Estes termos estão escritos em linguagem simples e ainda não foram revistos por um advogado qualificado. Não constituem aconselhamento jurídico. Como a BuyMeATee processa pagamentos reais, a sua revisão deve ser tratada como prioritária — a par do Stripe Connected Account Agreement.",
  sections: [
    {
      heading: "O que é a BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "A BuyMeATee é uma plataforma dedicada ao golfe onde os apoiantes apoiam criadores com um «Tee» — uma contribuição voluntária para o percurso e os objetivos de golfe de um criador. Fornecemos a plataforma e processamos os pagamentos através da Stripe; não somos um banco e não guardamos o seu dinheiro. Ao utilizar a BuyMeATee, aceita estes termos.",
        },
      ],
    },
    {
      heading: "Quem opera a BuyMeATee",
      blocks: [
        {
          kind: "paragraph",
          text: "A BuyMeATee é operada por Simon Berriman, empresário em nome individual (trabalhador independente), Karl-Rothe-Str. 4, 04105 Leipzig, Alemanha. Contacto: [hello@buymeatee.com](mailto:hello@buymeatee.com), +49 15207075439. (A lei alemã pode exigir que estes dados sejam apresentados num Impressum separado — a confirmar na revisão jurídica.)",
        },
      ],
    },
    {
      heading: "A sua conta",
      blocks: [
        {
          kind: "list",
          items: [
            "Tem de ter pelo menos 18 anos para criar uma conta.",
            "O início de sessão faz-se através de uma hiperligação de utilização única enviada por email. Mantenha seguro o acesso ao seu email — qualquer pessoa que o tenha pode aceder à sua conta.",
            "É responsável pela atividade na sua conta e pela exatidão do que publica.",
          ],
        },
      ],
    },
    {
      heading: "Enviar um Tee (apoiantes)",
      blocks: [
        {
          kind: "list",
          items: [
            "Um Tee é apoio voluntário, não a compra de um produto ou serviço, nem um investimento, um empréstimo ou um donativo a uma instituição de solidariedade registada. Não recebe quaisquer bens nem qualquer retorno financeiro.",
            "Os montantes apresentados no momento do pagamento incluem o Tee do criador, mais a taxa da plataforma BuyMeATee e os custos estimados de processamento do pagamento. O total é confirmado antes de pagar.",
            "O pagamento é cobrado pela Stripe. Os reembolsos ficam ao critério da plataforma ou do criador e são tratados através da Stripe; contacte-nos se houver um problema com um Tee.",
            "Não utilize a BuyMeATee para branqueamento de capitais, para fraude ou para enviar fundos que não tem o direito de enviar.",
          ],
        },
      ],
    },
    {
      heading: "Receber Tees (criadores)",
      blocks: [
        {
          kind: "list",
          items: [
            "Para receber Tees, tem de concluir o processo de adesão junto da Stripe e aceitar o [Stripe Connected Account Agreement](https://stripe.com/legal/connect-account). As transferências, os respetivos prazos e as verificações de identidade são regidos pela Stripe.",
            "A BuyMeATee retém de cada Tee uma taxa da plataforma, mais os custos de processamento do pagamento; o restante é transferido para a sua conta associada. As taxas são apresentadas antes de o apoiante pagar e podem ser alteradas mediante aviso prévio.",
            "É responsável por qualquer imposto devido sobre o apoio que recebe. A BuyMeATee não presta aconselhamento fiscal.",
            "Descreva os seus objetivos com honestidade. O apoio é dado com base na confiança; utilizar objetivos ou novidades para induzir apoiantes em erro constitui fundamento para remoção.",
          ],
        },
        {
          kind: "note",
          text: "**Estatuto amador — leia isto.** Aceitar dinheiro ou apoio pode afetar o seu estatuto amador ao abrigo das Regras do Estatuto Amador (R&A / USGA) e das regras do seu órgão de governo, clube, universidade ou circuito. Estas regras variam e mudam. É da sua responsabilidade verificar a sua própria situação antes de receber Tees — a BuyMeATee não pode aconselhá-lo sobre o seu estatuto amador.",
        },
      ],
    },
    {
      heading: "O seu conteúdo",
      blocks: [
        {
          kind: "paragraph",
          text: "Mantém a propriedade do que publica — o seu perfil, objetivos, novidades, imagens e hiperligações. Concede à BuyMeATee uma licença para alojar e apresentar esse conteúdo para efeitos de funcionamento da plataforma. Tem de ter o direito de o publicar, e o conteúdo não pode ser ilegal, violar direitos de terceiros, ser enganador, de incitamento ao ódio ou proibido a outro título. As hiperligações de conteúdos multimédia afixados para plataformas de terceiros (p. ex., YouTube, Instagram) estão sujeitas aos termos dessas plataformas.",
        },
      ],
    },
    {
      heading: "Utilização aceitável e moderação",
      blocks: [
        {
          kind: "paragraph",
          text: "Não utilize a BuyMeATee para violar a lei, infringir direitos de terceiros, enganar apoiantes ou abusar do serviço. Podemos rever, remover ou retirar de publicação conteúdo e suspender ou encerrar contas que violem estes termos ou que ponham em risco apoiantes, criadores ou a plataforma.",
        },
      ],
    },
    {
      heading: "Conteúdo e exatidão",
      blocks: [
        {
          kind: "paragraph",
          text: "Trabalhamos para manter a BuyMeATee honesta: o progresso dos objetivos reflete apenas pagamentos confirmados, nunca números introduzidos manualmente. Os artigos do blogue são informação de caráter geral, não aconselhamento profissional, financeiro ou jurídico.",
        },
      ],
    },
    {
      heading: "Propriedade intelectual",
      blocks: [
        {
          kind: "paragraph",
          text: "O nome, a marca e a plataforma BuyMeATee pertencem-nos. Pode partilhar hiperligações livremente; pedimos que não copie a plataforma nem se faça passar pela marca.",
        },
      ],
    },
    {
      heading: "Exclusões de garantia e responsabilidade",
      blocks: [
        {
          kind: "paragraph",
          text: "A BuyMeATee é disponibilizada «tal como está». Facilitamos o apoio entre apoiantes e criadores, mas não garantimos a conduta, os objetivos ou os resultados de qualquer criador. Na medida em que a lei o permita, não aceitamos qualquer responsabilidade pela relação entre apoiantes e criadores, nem por decisões tomadas com recurso à plataforma, e nada no presente documento limita direitos que lhe assistam ao abrigo da lei aplicável e que não possam ser limitados.",
        },
      ],
    },
    {
      heading: "Alterações",
      blocks: [
        {
          kind: "paragraph",
          text: "Poderemos atualizar estes termos à medida que o produto evolui. A data acima reflete a revisão mais recente; as alterações substanciais serão assinaladas.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consulte também a nossa [política de privacidade](/privacy).",
    },
  ],
};
