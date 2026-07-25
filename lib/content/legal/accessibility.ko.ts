import type { LegalDocument } from "./types";

/**
 * Accessibility statement — Korean translation.
 *
 * Translations of this document require professional legal review before
 * production reliance (see docs/i18n.md). A translation must keep every
 * clause — nothing may be shortened, reworded in substance, or dropped.
 * Convenience translation — the English version (accessibility.en.ts)
 * governs.
 */
export const accessibilityKo: LegalDocument = {
  title: "접근성",
  breadcrumbLabel: "접근성",
  intro:
    "골프는 모두를 위한 것이며, BuyMeATee도 마찬가지입니다. 당사가 접근성에 임하는 방식과, 부족한 점을 발견하셨을 때 알려 주시는 방법을 안내합니다.",
  lastUpdated: "2026-07-25",
  sections: [
    {
      heading: "당사의 약속",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 [웹 콘텐츠 접근성 지침(WCAG) 2.2, 레벨 AA](https://www.w3.org/TR/WCAG22/)를 충족하는 것을 목표로 합니다. 당사는 접근성을 사후 보완이 아니라 개발 단계에서 “완료”의 일부로 다룹니다. 어떤 방식으로 웹을 이용하든 누구나 골퍼의 여정을 따라가고 응원할 수 있도록 하기 위함입니다.",
        },
      ],
    },
    {
      heading: "당사가 하는 일",
      blocks: [
        {
          kind: "list",
          items: [
            "명확한 제목 구조와 랜드마크를 갖춘 시맨틱 HTML.",
            "눈에 보이는 “본문으로 건너뛰기” 링크와, 모든 상호작용 요소에 대한 키보드 접근.",
            "눈에 보이는 포커스 스타일과, 최소 터치 대상 크기를 충족하는 컨트롤.",
            "대비를 검증한 색상 선택과, 의미를 색상만으로 전달하지 않는 설계.",
            "의미 있는 이미지에 대한 대체 텍스트와, 아이콘만 있는 버튼에 대한 접근 가능한 이름.",
            "실제 레이블을 갖춘 양식과, 명확하게 안내(음성 출력)되는 오류 및 상태 메시지.",
            "글자를 확대해도 재배치되어 계속 사용할 수 있는 레이아웃.",
          ],
        },
      ],
    },
    {
      heading: "알려진 한계",
      blocks: [
        {
          kind: "paragraph",
          text: "당사는 진행 중인 작업에 대하여 솔직하게 말씀드립니다. 일부 영역 — 결제 및 대시보드 흐름의 일부, 그리고 크리에이터가 제출한 콘텐츠(이미지, 메시지 및 링크) 포함 — 은 아직 완전한 독립 감사를 거치지 않았습니다. Stripe 호스팅 결제 화면과 같은 제3자 구성 요소는 해당 제공업체 자체의 접근성 기준을 따릅니다. 당사는 문제를 발견하는 대로 수정하며, 제보를 환영합니다.",
        },
      ],
    },
    {
      heading: "문제를 알려 주십시오",
      blocks: [
        {
          kind: "paragraph",
          text: "이용에 장벽을 겪으셨거나 다른 형식의 자료가 필요하시면 [hello@buymeatee.com](mailto:hello@buymeatee.com)으로 이메일을 보내 주십시오. 해당 페이지, 시도하시던 작업, 그리고 사용하시던 보조 기술 또는 브라우저를 함께 알려 주시면 더 빠르게 수정하는 데 도움이 됩니다. 당사는 영업일 기준 며칠 이내에 회신하는 것을 목표로 합니다.",
        },
      ],
    },
  ],
};
