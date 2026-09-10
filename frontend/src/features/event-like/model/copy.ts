import type { ActionFailure } from "@/shared/ui";

/** 근거: docs/spec/06-상세-주최사.md 7.2 · 07-비교-찜.md 9장 · 02-공통규칙.md 2.4 */

/** 찜 성공 토스트 (7.2). 해제도 알린다 — 되돌릴 수 있다는 신호다 */
export const LIKE_TOAST = {
  liked: "찜 목록에 저장했어요",
  unliked: "찜을 해제했어요",
} as const;

/**
 * 실패 토스트 (10.3 알림 설정과 같은 형태).
 *
 * ⚠️ **`FormErrorNotice`(4.46)를 쓰지 않는다.** 그건 **폼 제출**의 자리다 — 폼이
 * 화면에 남아 있고 제출 버튼 자체가 재시도라서 성립한다. 찜은 카드 위의 토글이라
 * 코드·시각을 실을 자리가 없고, **되돌린 것 자체가 이미 보인다**(하트가 원래대로
 * 돌아온다). 기준은 `사용자가 잃을 것이 있는가` 다 (`decisions.md` 4.60).
 */
export const LIKE_FAILED_TOAST = "찜을 저장하지 못했어요. 잠시 후 다시 시도해주세요";

/** 접근성 라벨 (15장). 색으로만 구분하지 않는다 */
export function likeLabel(liked: boolean): string {
  return liked ? "찜 해제" : "찜하기";
}

/**
 * 찜 토글의 결과. 실패하면 **화면이 되돌린다.**
 *
 * `ActionFailure` 를 그대로 쓰는 이유는 코드·시각을 버리지 않기 위해서다 — 토스트에
 * 싣지는 않지만 `console` 로 남겨 개발 중에 원인을 본다.
 */
export type LikeResult = { ok: true } | { ok: false; failure: ActionFailure };
