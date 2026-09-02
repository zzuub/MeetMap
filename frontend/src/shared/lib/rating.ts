import {
  RATING_PRIOR_MEAN,
  RATING_PRIOR_WEIGHT,
  REVIEW_DISPLAY_MIN_COUNT,
} from "../config/constants";

/**
 * 주최사 평점의 순수 규칙 (7.4 / 6.2).
 *
 * **`entities` 가 아니라 `shared` 에 있는 이유**: 평점은 주최사의 값이지만
 * `entities/event` 의 목 구현도 같은 산식을 써야 한다 — 탐색 정렬(`sort=rating`)이
 * 소개팅 목록을 주최사 평점 순으로 세우기 때문이다. entity 끼리는 서로를
 * 참조할 수 없으므로(FSD) 두 슬라이스가 함께 볼 수 있는 자리는 `shared` 뿐이다.
 *
 * 산식을 두 벌로 두면 목록 정렬과 주최사 페이지의 순위가 어긋난다. 상수도
 * 이미 `shared/config` 에 있으니 함수를 그 옆에 두는 편이 짝이 맞는다 (4.2 선례).
 */

/**
 * 정렬용 베이지안 보정 평점.
 *
 * ```
 * ratingScore = (C × m + 평점합) / (C + n)
 * ```
 *
 * **왜 하드 컷이 아닌가.** `후기 5건 이상만 정렬 대상`으로 자르면 절벽이 생긴다 —
 * 4건짜리는 목록에서 아예 빠졌다가 5번째 후기가 달리는 순간 5.0 으로 1위에
 * 점프한다. 보정식은 표본이 적을수록 전체 평균 쪽으로 끌어당겨 **표본이 적은
 * 만점이 표본 많은 고득점을 이기지 못하게** 한다.
 *
 * | 주최사 | 원본 | 보정 |
 * | --- | --- | --- |
 * | 후기 3건 · 평균 5.0 | 5.00 | 4.46 |
 * | 후기 50건 · 평균 4.6 | 4.60 | 4.55 |
 * | 후기 0건 | — | 4.30 (= m, 맨 아래가 아니라 **중간**) |
 *
 * 후기 0건이 맨 아래로 깔리지 않는 것이 핵심이다. 신규 주최사가 구조적으로
 * 묻히면 평점 정렬은 기존 주최사만 위한 장치가 된다 (`progress.md` 4.20).
 *
 * ⚠️ 이 값을 **화면에 노출하지 않는다.** 표시용 원본 평균과 나란히 보이면
 * "4.6인데 왜 4.5보다 아래냐"에 답할 수 없다.
 */
export function ratingScore(ratingSum: number, reviewCount: number): number {
  return (
    (RATING_PRIOR_WEIGHT * RATING_PRIOR_MEAN + ratingSum) /
    (RATING_PRIOR_WEIGHT + reviewCount)
  );
}

/**
 * 평점을 **숫자로 표시해도 되는지** (7.4).
 *
 * 정렬 임계와 다른 값이다 — 정렬은 `ratingScore` 가 절벽 없이 연속으로 처리하고,
 * 이 임계는 화면에 `4.6` 을 띄울지 `후기 3건` 만 띄울지를 정한다.
 */
export function canShowRating(reviewCount: number): boolean {
  return reviewCount >= REVIEW_DISPLAY_MIN_COUNT;
}

/**
 * 표시 임계를 적용한 평점. 미달이면 `null` 로 떨어진다.
 * 서버가 할 일이지만 목 구현이 같은 답을 내야 하므로 규칙을 여기 둔다.
 */
export function applyDisplayThreshold(
  average: number,
  reviewCount: number,
): number | null {
  return canShowRating(reviewCount) ? average : null;
}
