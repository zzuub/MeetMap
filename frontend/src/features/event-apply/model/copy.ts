/**
 * 외부 신청 이동 모달의 고정 문구 (7.3).
 *
 * **법적 고지·경고가 타협 불가 항목이라** JSX 안에 리터럴로 흩지 않는다. 한곳에
 * 모아 두면 무엇이 빠졌는지 눈으로 셀 수 있고, 아래 테스트가 필수 구절을 잠근다.
 */
export const OUTBOUND_COPY = {
  title: "외부 신청 페이지로 이동합니다",
  /** 결제 비대행 고지 — 필수 (7.3) */
  notice:
    "신청과 결제는 주최사 페이지에서 진행됩니다. MeetMap은 결제를 대행하지 않습니다.",
  conditionsHeading: "신청 전 확인해주세요",
  /** 하단 경고 — 필수 (7.3) */
  warning: "조건에 맞지 않는 신청은 주최사에 의해 취소될 수 있습니다.",
  /** 마감 회차에만 (`decisions.md` 4.37). 막지 않고 알린다 */
  closedNotice:
    "이 소개팅은 마감으로 등록돼 있어요. 주최사 페이지에서 아직 신청을 받는지 먼저 확인해주세요.",
  cancel: "취소",
  confirm: "확인하고 이동",
} as const;

export type OutboundCopyKey = keyof typeof OUTBOUND_COPY;

/**
 * 문구가 바뀌어도 남아 있어야 하는 구절. 전문을 다시 적지 않는다 — 오타에도 깨지는
 * 사본이 하나 더 생길 뿐이고, 지켜야 하는 것은 문장이 아니라 이 구절들이다 (7.3 필수 표).
 *
 * `Record<OutboundCopyKey, …>` 라 문구를 더하면 **컴파일 에러**가 난다 — 필수인지
 * 아닌지 판단을 강제한다. 필수 구절이 없는 항목은 빈 배열이다.
 */
export const REQUIRED_PHRASES: Record<OutboundCopyKey, readonly string[]> = {
  title: [],
  notice: ["결제를 대행하지 않습니다", "주최사 페이지"],
  conditionsHeading: [],
  warning: ["취소될 수 있습니다"],
  closedNotice: ["마감"],
  cancel: [],
  confirm: [],
};
