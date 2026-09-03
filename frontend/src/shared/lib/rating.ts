import {
  RATING_PRIOR_MEAN,
  RATING_PRIOR_WEIGHT,
  REVIEW_DISPLAY_MIN_COUNT,
} from "../config/constants";

/**
 * 주최사 평점 규칙 (기능정의서 7.4 / 6.2).
 *
 * `entities` 가 아니라 `shared` 에 있는 이유와 대안 검토는 `progress.md` 4.21.
 * 요약하면 `entities/event` 의 정렬과 `entities/provider` 의 표시가 같은 산식을
 * 써야 하는데 entity 끼리는 서로를 참조할 수 없다.
 */

/**
 * 정렬용 베이지안 보정 평점 — `(C × m + 평점합) / (C + n)`.
 *
 * 표본이 적을수록 전체 평균 쪽으로 당겨진다. 후기 3건·평균 5.0 이 후기 50건·평균
 * 4.6 을 이기지 못하고, 후기 0건은 `m` 을 받아 맨 아래가 아니라 중간에 놓인다.
 * 하드 컷을 쓰지 않는 이유는 `progress.md` 4.20.
 *
 * ⚠️ 화면에 노출하지 않는다. 표시용 원본 평균과 나란히 보이면 순위를 설명할 수 없다.
 */
export function ratingScore(ratingSum: number, reviewCount: number): number {
  return (
    (RATING_PRIOR_WEIGHT * RATING_PRIOR_MEAN + ratingSum) /
    (RATING_PRIOR_WEIGHT + reviewCount)
  );
}

/** 평점을 숫자로 표시해도 되는지. 정렬 임계와 별개다 (7.4) */
export function canShowRating(reviewCount: number): boolean {
  return reviewCount >= REVIEW_DISPLAY_MIN_COUNT;
}

/** 표시 임계를 적용한 평점. 미달이면 `null` — 화면은 `후기 N건` 만 쓴다 */
export function applyDisplayThreshold(
  average: number,
  reviewCount: number,
): number | null {
  return canShowRating(reviewCount) ? average : null;
}
