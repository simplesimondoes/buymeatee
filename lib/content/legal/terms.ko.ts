import type { LegalDocument } from "./types";

/**
 * Terms of Use — Korean translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (terms.en.ts) governs.
 */
export const termsKo: LegalDocument = {
  title: "이용약관",
  breadcrumbLabel: "약관",
  intro: "BuyMeATee 이용에 관한 기본 규칙입니다.",
  lastUpdated: "2026-07-24",
  draftNote:
    "본 약관은 알기 쉬운 언어로 작성되었으며, 아직 자격을 갖춘 변호사의 검토를 받지 않았습니다. 법률 자문이 아닙니다. BuyMeATee는 실제 결제를 처리하므로, 본 약관은 Stripe Connected Account Agreement와 함께 우선적으로 검토되어야 합니다.",
  sections: [
    {
      heading: "BuyMeATee란 무엇인가",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee는 서포터가 “티(Tee)”로 크리에이터를 후원하는 골프 특화 플랫폼입니다. 티는 크리에이터의 골프 여정과 목표를 위한 자발적인 기여입니다. 당사는 플랫폼을 제공하고 Stripe를 통해 결제를 처리하며, 은행이 아니고 귀하의 자금을 보관하지 않습니다. BuyMeATee를 이용함으로써 귀하는 본 약관에 동의하게 됩니다.",
        },
      ],
    },
    {
      heading: "BuyMeATee의 운영자",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee는 개인사업자(프리랜서)인 Simon Berriman(주소: Karl-Rothe-Str. 4, 04105 Leipzig, Germany)이 운영합니다. 연락처: [hello@buymeatee.com](mailto:hello@buymeatee.com), +49 15207075439. (독일 법률상 이러한 정보를 별도의 Impressum으로 게시해야 할 수 있으며, 이는 법률 검토를 통해 확정될 예정입니다.)",
        },
      ],
    },
    {
      heading: "귀하의 계정",
      blocks: [
        {
          kind: "list",
          items: [
            "계정을 만들려면 만 18세 이상이어야 합니다.",
            "로그인은 일회용 이메일 링크로 이루어집니다. 이메일 접근 권한을 안전하게 관리하십시오. 해당 이메일에 접근할 수 있는 사람은 누구든지 귀하의 계정에 접근할 수 있습니다.",
            "귀하는 귀하의 계정에서 이루어지는 활동과 귀하가 게시하는 내용의 정확성에 대하여 책임을 집니다.",
          ],
        },
      ],
    },
    {
      heading: "티 보내기(서포터)",
      blocks: [
        {
          kind: "list",
          items: [
            "티는 자발적인 응원이며, 제품이나 서비스의 구매가 아니고, 투자나 대출이 아니며, 등록된 자선단체에 대한 기부도 아닙니다. 귀하는 어떠한 재화도, 어떠한 금전적 수익도 받지 않습니다.",
            "결제 화면에 표시되는 금액에는 크리에이터에게 전달되는 티 금액과 함께 BuyMeATee 플랫폼 수수료 및 예상 결제 처리 수수료가 포함됩니다. 총액은 결제 전에 확정되어 표시됩니다.",
            "결제는 Stripe가 처리합니다. 환불은 플랫폼 또는 크리에이터의 재량에 따르며 Stripe를 통해 처리됩니다. 티와 관련하여 문제가 있는 경우 당사에 문의하십시오.",
            "BuyMeATee를 자금세탁이나 사기에 이용하거나, 보낼 권한이 없는 자금을 보내는 데 사용하지 마십시오.",
          ],
        },
      ],
    },
    {
      heading: "티 받기(크리에이터)",
      blocks: [
        {
          kind: "list",
          items: [
            "티를 받으려면 Stripe 온보딩을 완료하고 [Stripe Connected Account Agreement](https://stripe.com/legal/connect-account)에 동의해야 합니다. 정산, 정산 시기 및 신원 확인은 Stripe가 관장합니다.",
            "BuyMeATee는 각 티에서 플랫폼 수수료와 결제 처리 수수료를 공제하며, 나머지 금액은 귀하의 연결된 계정으로 이체됩니다. 수수료는 서포터가 결제하기 전에 표시되며, 사전 고지 후 변경될 수 있습니다.",
            "귀하가 받은 응원에 대하여 납부하여야 하는 세금은 귀하의 책임입니다. BuyMeATee는 세무 자문을 제공하지 않습니다.",
            "목표를 정직하게 설명하십시오. 응원은 신뢰를 바탕으로 이루어지며, 목표나 소식을 이용하여 서포터를 오도하는 행위는 계정 삭제 사유가 됩니다.",
          ],
        },
        {
          kind: "note",
          text: "**아마추어 자격 — 반드시 읽으십시오.** 금전이나 응원을 받는 것은 아마추어 자격 규칙(R&A / USGA) 및 귀하가 소속된 관장 기구, 클럽, 대학 또는 투어의 규정에 따라 귀하의 아마추어 자격에 영향을 줄 수 있습니다. 이러한 규정은 기관마다 다르며 변경됩니다. 티를 받기 전에 본인의 상황을 확인하는 것은 귀하의 책임이며, BuyMeATee는 귀하의 아마추어 자격에 관하여 자문할 수 없습니다.",
        },
      ],
    },
    {
      heading: "귀하의 콘텐츠",
      blocks: [
        {
          kind: "paragraph",
          text: "귀하가 게시하는 콘텐츠 — 프로필, 목표, 소식, 이미지 및 링크 — 의 소유권은 귀하에게 있습니다. 귀하는 BuyMeATee가 플랫폼을 운영하기 위하여 해당 콘텐츠를 호스팅하고 표시할 수 있는 라이선스를 BuyMeATee에 부여합니다. 귀하는 해당 콘텐츠를 게시할 권리를 보유하고 있어야 하며, 콘텐츠는 불법적이거나, 타인의 권리를 침해하거나, 오해를 일으키거나, 혐오적이거나, 그 밖에 금지된 것이어서는 안 됩니다. 제3자 플랫폼(예: YouTube, Instagram)으로 연결되는 고정 미디어 링크에는 해당 플랫폼 자체의 약관이 적용됩니다.",
        },
      ],
    },
    {
      heading: "허용되는 이용과 모더레이션",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee를 법률 위반, 타인의 권리 침해, 서포터 기만 또는 서비스 남용에 사용하지 마십시오. 당사는 본 약관을 위반하거나 서포터, 크리에이터 또는 플랫폼을 위험에 빠뜨리는 콘텐츠를 검토·삭제하거나 게시를 중단할 수 있으며, 해당 계정을 정지하거나 폐쇄할 수 있습니다.",
        },
      ],
    },
    {
      heading: "콘텐츠와 정확성",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 BuyMeATee를 정직하게 유지하기 위하여 노력합니다. 목표 진행 상황은 확인된 결제만을 반영하며, 직접 입력된 숫자는 절대 반영하지 않습니다. 블로그 글은 일반적인 정보이며, 전문적·재정적·법률적 자문이 아닙니다.",
        },
      ],
    },
    {
      heading: "지식재산권",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee라는 이름, 상표 및 플랫폼은 당사에 귀속됩니다. 링크는 자유롭게 공유하실 수 있으나, 플랫폼을 복제하거나 브랜드를 자신의 것처럼 사칭하지 마십시오.",
        },
      ],
    },
    {
      heading: "면책 및 책임",
      blocks: [
        {
          kind: "paragraph",
          text: "BuyMeATee는 있는 그대로(as-is) 제공됩니다. 당사는 서포터와 크리에이터 사이의 응원을 중개할 뿐, 어떠한 크리에이터의 행동, 목표 또는 결과도 보장하지 않습니다. 법률이 허용하는 범위 내에서 당사는 서포터와 크리에이터 사이의 관계 또는 플랫폼을 이용하여 내린 결정에 대하여 어떠한 책임도 지지 않으며, 본 약관의 어떠한 내용도 제한이 허용되지 않는 관련 법률상의 귀하의 권리를 제한하지 않습니다.",
        },
      ],
    },
    {
      heading: "변경",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 제품이 발전함에 따라 본 약관을 개정할 수 있습니다. 위의 날짜는 최신 개정일을 나타내며, 중대한 변경 사항은 별도로 안내됩니다.",
        },
      ],
    },
  ],
  closing: [
    {
      kind: "paragraph",
      text: "당사의 [개인정보 처리방침](/privacy)도 함께 참조하십시오.",
    },
  ],
};
