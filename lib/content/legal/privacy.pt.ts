import type { LegalDocument } from "./types";

/**
 * Privacy Policy — Portuguese (pt-PT) translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (privacy.en.ts) governs.
 */
export const privacyPt: LegalDocument = {
  title: "Política de privacidade",
  breadcrumbLabel: "Privacidade",
  intro: "O que recolhemos, porquê, quem o trata e as escolhas que tem.",
  lastUpdated: "2026-07-24",
  draftNote:
    "Esta política descreve o que o produto realmente faz, mas ainda não foi revista por um advogado qualificado nem por um consultor de proteção de dados. Não constitui aconselhamento jurídico. As secções sobre pagamentos, contas e analítica, em particular, ainda carecem de aprovação por um consultor qualificado.",
  sections: [
    {
      heading: "Quem somos",
      blocks: [
        {
          kind: "paragraph",
          text: "A BuyMeATee («nós») é a plataforma disponível em buymeatee.com — uma forma centrada no golfe de os apoiantes apoiarem criadores com um «Tee». É operada por Simon Berriman, empresário em nome individual com morada em Karl-Rothe-Str. 4, 04105 Leipzig, Alemanha, que é o responsável pelo tratamento dos dados pessoais aqui descritos. Para os pagamentos trabalhamos com a Stripe, que atua como responsável pelo tratamento independente relativamente aos dados de pagamento e de verificação de identidade que recolhe (ver «Pagamentos», abaixo). Para qualquer pedido relativo à privacidade, contacte [hello@buymeatee.com](mailto:hello@buymeatee.com) ou +49 15207075439. Os dados completos do operador constam do nosso [Impressum](/impressum).",
        },
      ],
    },
    {
      heading: "O que recolhemos",
      blocks: [
        {
          kind: "paragraph",
          text: "**Contas:** utilizamos início de sessão sem palavra-passe, pelo que guardamos o seu endereço de email e os dados da sessão de início de sessão. Nunca armazenamos palavras-passe.",
        },
        {
          kind: "paragraph",
          text: "**Perfis de criador:** os dados que escolhe publicar — nome apresentado, hiperligação da página (nome de utilizador), biografia e texto «Sobre», fotografia e imagem de capa, e, opcionalmente, detalhes de golfe (handicap, localização, clube de origem, lateralidade), hiperligações para redes sociais, conteúdos multimédia afixados, objetivos e novidades publicadas. Esta informação é pública por definição.",
        },
        {
          kind: "paragraph",
          text: "**Enviar ou receber Tees:** quando envia um Tee, tratamos o montante, uma mensagem opcional, o nome apresentado (ou «Anónimo», se assim escolher) e — se o fornecer — um email para o seu recibo. Os dados do cartão são introduzidos diretamente junto da Stripe e nunca chegam aos nossos servidores. Os criadores que recebem Tees concluem a verificação de identidade e a configuração das transferências junto da Stripe.",
        },
      ],
    },
    {
      heading: "Cookies e analítica",
      blocks: [
        {
          kind: "paragraph",
          text: "Utilizamos cookies essenciais para o manter com sessão iniciada — estão sempre ativos, porque o site precisa deles para funcionar. Utilizamos também o Google Analytics (GA4) para perceber, de forma agregada, como o site é utilizado, o que instala cookies de analítica. A analítica só é carregada se a aceitar: na primeira visita, um aviso pede-lhe que faça a sua escolha, e nada relacionado com analítica é executado até dar o seu consentimento. Pode alterar ou retirar a sua escolha em qualquer momento através de **Definições de cookies**, no rodapé.",
        },
      ],
    },
    {
      heading: "Porque os recolhemos, e a nossa base jurídica",
      blocks: [
        {
          kind: "list",
          items: [
            "Para prestar o serviço — contas, páginas de criador, objetivos, novidades e o processamento de Tees (*execução de um contrato*).",
            "Para enviar emails transacionais — hiperligações de início de sessão, recibos dos apoios e notificações aos criadores (*contrato / interesses legítimos*).",
            "Para manter a plataforma segura, prevenir fraude e abusos e compreender a utilização (*interesses legítimos*).",
            "Para cumprir obrigações legais, fiscais e de prevenção do branqueamento de capitais relacionadas com pagamentos (*obrigação legal*, em grande parte através da Stripe).",
          ],
        },
        {
          kind: "paragraph",
          text: "Não vendemos os seus dados pessoais.",
        },
      ],
    },
    {
      heading: "Pagamentos (Stripe)",
      blocks: [
        {
          kind: "paragraph",
          text: "Os pagamentos funcionam na Stripe, através do Stripe Connect. Quando paga, os dados do seu cartão vão diretamente para a Stripe — a BuyMeATee nunca os vê nem os armazena. Os criadores que recebem Tees fazem a adesão junto da Stripe, que recolhe os dados de identidade e bancários de que necessita para os verificar e lhes fazer as transferências; a Stripe trata esses dados como responsável pelo tratamento independente, ao abrigo da sua própria [política de privacidade](https://stripe.com/privacy). Guardamos um registo de cada Tee (montantes, estado, referências e qualquer mensagem) para operar o serviço, mostrar o progresso e tratar reembolsos e disputas.",
        },
      ],
    },
    {
      heading: "Quem trata os seus dados",
      blocks: [
        {
          kind: "paragraph",
          text: "Só partilhamos dados pessoais com prestadores de serviços que nos ajudam a operar a BuyMeATee:",
        },
        {
          kind: "list",
          items: [
            "**Supabase** — base de dados, armazenamento de ficheiros e autenticação (alojamento na UE).",
            "**Stripe** — pagamentos, transferências e verificação de identidade.",
            "**Resend** — envio de email transacional.",
            "**Vercel** — alojamento do site e registos de servidor habituais.",
            "**Google Analytics** — analítica de utilização agregada.",
          ],
        },
        {
          kind: "paragraph",
          text: "Alguns destes prestadores estão sediados nos Estados Unidos ou tratam dados nesse país. Sempre que dados pessoais saem do Reino Unido/EEE, são protegidos por garantias adequadas, como as Cláusulas Contratuais-Tipo. A lista completa de subcontratantes e os mecanismos de transferência serão confirmados na revisão jurídica.",
        },
      ],
    },
    {
      heading: "Durante quanto tempo os conservamos",
      blocks: [
        {
          kind: "paragraph",
          text: "Conservamos os registos de conta, de perfil e de pagamentos enquanto tiver uma conta e, depois disso, enquanto a tal formos obrigados por razões legais, fiscais e contabilísticas. O conteúdo público que publica permanece visível até que o remova ou encerre a sua conta.",
        },
      ],
    },
    {
      heading: "Os seus direitos",
      blocks: [
        {
          kind: "paragraph",
          text: "Ao abrigo do direito da proteção de dados do Reino Unido e da UE, pode pedir para aceder aos seus dados pessoais, corrigi-los, apagá-los ou exportá-los, opor-se a determinados tratamentos ou pedir a sua limitação, e retirar o consentimento em qualquer momento. Pode ainda apresentar reclamação junto da sua autoridade de proteção de dados (no Reino Unido, o ICO). Alguns registos de pagamento e fiscais têm de ser conservados mesmo que peça o apagamento.",
        },
      ],
    },
    {
      heading: "Menores",
      blocks: [
        {
          kind: "paragraph",
          text: "A BuyMeATee destina-se a adultos (18+). Os golfistas juniores participam apenas através de um progenitor ou tutor adequado, que é responsável pela sua participação.",
        },
      ],
    },
    {
      heading: "Alterações a esta política",
      blocks: [
        {
          kind: "paragraph",
          text: "Iremos atualizar esta política à medida que o produto evolui; a data acima reflete a revisão mais recente. As alterações substanciais serão destacadas antes de produzirem efeitos.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "Consulte também os nossos [termos](/terms) e as [perguntas frequentes](/faq).",
    },
  ],
};
