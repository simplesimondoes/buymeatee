import type { LegalDocument } from "./types";

/**
 * Privacy Policy — Korean translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (privacy.en.ts) governs.
 */
export const privacyKo: LegalDocument = {
  title: "개인정보 처리방침",
  breadcrumbLabel: "개인정보",
  intro: "당사가 수집하는 정보와 그 이유, 처리 주체, 그리고 귀하가 가진 선택권을 안내합니다.",
  lastUpdated: "2026-07-24",
  draftNote:
    "본 방침은 제품이 실제로 수행하는 내용을 기술하고 있으나, 아직 자격을 갖춘 변호사나 개인정보 보호 자문가의 검토를 받지 않았습니다. 법률 자문이 아닙니다. 특히 결제, 계정 및 분석 관련 항목은 자격을 갖춘 자문가의 승인을 받아야 합니다.",
  sections: [
    {
      heading: "우리는 누구인가",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee(“당사”)는 buymeatee.com에서 운영되는 플랫폼으로, 서포터가 “티(Tee)”로 크리에이터를 후원하는 골프 특화 서비스입니다. 본 플랫폼은 Karl-Rothe-Str. 4, 04105 Leipzig, Germany에 소재한 개인사업자 Simon Berriman이 운영하며, 그는 본 방침에서 기술하는 개인정보의 개인정보처리자(controller)입니다. 결제와 관련하여 당사는 Stripe와 협력하며, Stripe는 자신이 수집하는 결제 및 신원 확인 데이터에 대하여 독립적인 개인정보처리자로서 행위합니다(아래 “결제” 항목 참조). 개인정보 관련 요청은 [hello@buymeatee.com](mailto:hello@buymeatee.com) 또는 +49 15207075439로 연락하시기 바랍니다. 운영자에 관한 전체 정보는 당사의 [Impressum](/impressum)에 있습니다.",
        },
      ],
    },
    {
      heading: "수집하는 정보",
      blocks: [
        {
          kind: "paragraph",
          text: "**계정:** 당사는 비밀번호 없는 로그인 방식을 사용하므로, 귀하의 이메일 주소와 로그인 세션 데이터를 보유합니다. 당사는 비밀번호를 절대 저장하지 않습니다.",
        },
        {
          kind: "paragraph",
          text: "**크리에이터 프로필:** 귀하가 공개하기로 선택한 정보 — 표시 이름, 페이지 링크(사용자명), 소개글 및 About 텍스트, 사진과 커버 이미지, 그리고 선택 사항인 골프 정보(핸디캡, 지역, 홈 클럽, 사용 손), 소셜 링크, 고정 미디어, 목표 및 게시한 소식. 이 정보는 설계상 공개됩니다.",
        },
        {
          kind: "paragraph",
          text: "**티 보내기 또는 받기:** 귀하가 티를 보낼 때 당사는 금액, 선택 사항인 메시지, 표시될 이름(원하시는 경우 “익명”), 그리고 — 제공하시는 경우 — 영수증을 받을 이메일을 처리합니다. 카드 정보는 Stripe에 직접 입력되며 당사 서버에 절대 도달하지 않습니다. 티를 받는 크리에이터는 Stripe를 통해 신원 확인 및 정산 설정을 완료합니다.",
        },
      ],
    },
    {
      heading: "쿠키와 분석",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 로그인 상태 유지를 위한 필수 쿠키와, 귀하의 언어 선택을 기억하기 위한 기능 쿠키(`NEXT_LOCALE`)를 사용합니다. 이 쿠키들은 사이트 작동에 반드시 필요하므로 항상 활성화되어 있으며, 추적 목적으로는 사용되지 않습니다. 또한 당사는 사이트가 어떻게 이용되는지 집계 수준에서 파악하기 위하여 Google Analytics(GA4)를 사용하며, 이 과정에서 분석 쿠키가 설정됩니다. 분석 도구는 귀하가 동의한 경우에만 로드됩니다. 첫 방문 시 배너가 귀하의 선택을 묻고, 귀하가 동의하기 전에는 분석과 관련된 어떠한 것도 실행되지 않습니다. 귀하는 페이지 하단의 **쿠키 설정**을 통하여 언제든지 선택을 변경하거나 철회할 수 있습니다.",
        },
      ],
    },
    {
      heading: "수집하는 이유와 법적 근거",
      blocks: [
        {
          kind: "list",
          items: [
            "서비스 제공 — 계정, 크리에이터 페이지, 목표, 소식 및 티 처리(*계약의 이행*).",
            "거래 관련 이메일 발송 — 로그인 링크, 선물 영수증 및 크리에이터 알림(*계약 / 정당한 이익*).",
            "플랫폼 보안 유지, 사기 및 남용 방지, 이용 현황 파악(*정당한 이익*).",
            "결제와 관련된 법률·세무·자금세탁방지 의무 이행(*법적 의무*, 대부분 Stripe를 통하여 이행).",
          ],
        },
        {
          kind: "paragraph",
          text: "당사는 귀하의 개인정보를 판매하지 않습니다.",
        },
      ],
    },
    {
      heading: "결제(Stripe)",
      blocks: [
        {
          kind: "paragraph",
          text: "결제는 Stripe Connect를 사용하여 Stripe에서 처리됩니다. 결제 시 귀하의 카드 정보는 Stripe로 직접 전달되며, BuyMeATee는 이를 열람하거나 저장하지 않습니다. 티를 받는 크리에이터는 Stripe 온보딩을 진행하며, Stripe는 크리에이터의 신원 확인과 정산에 필요한 신원 및 은행 정보를 수집합니다. Stripe는 자체 [개인정보 처리방침](https://stripe.com/privacy)에 따라 독립적인 개인정보처리자로서 해당 데이터를 처리합니다. 당사는 서비스 운영, 진행 상황 표시, 환불 및 분쟁 처리를 위하여 각 티의 기록(금액, 상태, 참조 정보 및 메시지)을 저장합니다.",
        },
      ],
    },
    {
      heading: "귀하의 데이터를 처리하는 주체",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 BuyMeATee 운영을 돕는 서비스 제공업체에 한하여 개인정보를 공유합니다:",
        },
        {
          kind: "list",
          items: [
            "**Supabase** — 데이터베이스, 파일 저장소 및 인증(EU 내 호스팅).",
            "**Stripe** — 결제, 정산 및 신원 확인.",
            "**Resend** — 거래 관련 이메일 발송.",
            "**Vercel** — 웹사이트 호스팅 및 표준 서버 로그.",
            "**Google Analytics** — 집계 수준의 이용 분석(동의 후에만).",
            "**OpenAI** — 추천 공유 및 소셜 게시물 문구의 선택적 AI 초안 작성으로, 크리에이터가 개인화하기로 선택한 콘텐츠만을 처리합니다(미국 소재).",
            "**Printful** — 굿즈 주문의 주문형 인쇄 제작 및 배송으로, 주문 이행 및 발송에 필요한 고객 이름과 배송 주소를 포함합니다(미국 소재).",
          ],
        },
        {
          kind: "paragraph",
          text: "이들 제공업체 중 일부(Stripe, Vercel, Google Analytics, OpenAI 및 Printful 포함)는 미국에 소재하거나 미국에서 데이터를 처리합니다. 개인정보가 영국/EEA 밖으로 이전되는 경우, 표준계약조항(Standard Contractual Clauses)과 같은 적절한 보호 조치에 의하여 보호됩니다. 처리업체 전체 목록과 이전 메커니즘은 법률 검토를 통하여 확정될 예정입니다.",
        },
      ],
    },
    {
      heading: "보유 기간",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 귀하가 계정을 보유하는 동안 귀하의 계정 및 프로필 데이터를 보관하며, 계정을 폐쇄하신 후 약 30일 이내에 이를 삭제합니다 — 다만 법률상 더 오래 보관하도록 요구되는 경우는 예외입니다. 결제, 청구서 및 세무 기록은 독일 사업자에게 요구되는 법정 기간(일반적으로 독일 상법(HGB)·조세기본법(AO)에 따라 최대 10년) 동안 보관됩니다. 귀하가 게시한 공개 콘텐츠는 귀하가 삭제하거나 계정을 폐쇄할 때까지 계속 공개됩니다.",
        },
      ],
    },
    {
      heading: "귀하의 권리",
      blocks: [
        {
          kind: "paragraph",
          text: "EU 일반개인정보보호법(GDPR)(및 이에 상응하는 영국 법률)에 따라 귀하는 자신의 개인정보에 대한 열람, 정정, 삭제 또는 이동(내보내기)을 요청할 수 있고, 특정 처리에 대하여 이의를 제기하거나 처리 제한을 요청할 수 있으며, 언제든지 동의를 철회할 수 있습니다. 또한 귀하는 개인정보 감독기관에 민원을 제기할 수 있습니다: 운영자가 독일에 설립되어 있으므로 관할 기관은 작센 개인정보보호·투명성 감독관(Sächsische Datenschutz- und Transparenzbeauftragte)이며, 귀하가 거주하는 국가의 감독기관에도 연락할 수 있습니다. 일부 결제 및 세무 기록은 귀하가 삭제를 요청하더라도 보관되어야 합니다.",
        },
      ],
    },
    {
      heading: "아동",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee는 성인(만 18세 이상)을 위한 서비스입니다. 주니어 골퍼는 적절한 부모 또는 보호자를 통해서만 참여할 수 있으며, 그 참여에 대한 책임은 해당 부모 또는 보호자에게 있습니다.",
        },
      ],
    },
    {
      heading: "본 방침의 변경",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 제품이 발전함에 따라 본 방침을 개정합니다. 위의 날짜는 최신 개정일을 나타냅니다. 중대한 변경 사항은 효력 발생 전에 별도로 강조하여 안내됩니다.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "당사의 [이용약관](/terms)과 [자주 묻는 질문](/faq)도 함께 참조하십시오.",
    },
  ],
};
