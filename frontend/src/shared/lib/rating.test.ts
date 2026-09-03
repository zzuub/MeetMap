import { describe, expect, it } from "vitest";
import {
  RATING_PRIOR_MEAN,
  RATING_PRIOR_WEIGHT,
  REVIEW_DISPLAY_MIN_COUNT,
} from "../config/constants";
import { applyDisplayThreshold, canShowRating, ratingScore } from "./rating";

/**
 * 주최사 평점 규칙 (7.4 / 6.2).
 *
 * 이 두 규칙이 서로 다른 임계를 쓴다는 것이 이 파일이 지키려는 핵심이다 —
 * **표시는 하드 컷(5건), 정렬은 연속 보정.** 둘을 같은 값으로 묶으면 정렬에
 * 절벽이 생긴다.
 */

/** 소수점 오차를 감안한 비교. 산식이 나눗셈이라 정확 일치를 요구하지 않는다 */
const near = (actual: number, expected: number) =>
  expect(actual).toBeCloseTo(expected, 2);

describe("ratingScore — 정렬용 베이지안 보정", () => {
  it("후기 0건은 맨 아래가 아니라 전체 평균을 받는다", () => {
    // 신규 주최사가 구조적으로 묻히면 평점 정렬은 기존 주최사만 위한 장치가 된다
    near(ratingScore(0, 0), RATING_PRIOR_MEAN);
  });

  it("표본이 적은 만점이 표본 많은 고득점을 이기지 못한다", () => {
    const fewPerfect = ratingScore(5.0 * 3, 3); // 후기 3건 · 평균 5.0
    const manyGood = ratingScore(4.6 * 50, 50); // 후기 50건 · 평균 4.6

    near(fewPerfect, 4.46);
    near(manyGood, 4.55);
    expect(fewPerfect).toBeLessThan(manyGood);
  });

  it("원본 평균보다 항상 전체 평균 쪽으로 당겨진다", () => {
    // 평균보다 높은 주최사는 내려오고
    expect(ratingScore(4.9 * 10, 10)).toBeLessThan(4.9);
    // 평균보다 낮은 주최사는 올라간다
    expect(ratingScore(3.0 * 10, 10)).toBeGreaterThan(3.0);
  });

  it("표본이 커질수록 원본 평균에 수렴한다", () => {
    const gap = (n: number) => Math.abs(ratingScore(4.8 * n, n) - 4.8);
    expect(gap(200)).toBeLessThan(gap(20));
    expect(gap(20)).toBeLessThan(gap(2));
  });

  it("보정 강도는 신뢰 상수가 정한다", () => {
    // C 만큼의 가상 후기가 전체 평균으로 들어와 있는 것과 같다.
    // 후기 수가 C 와 같으면 원본과 전체 평균의 정확히 중간이다.
    near(ratingScore(5.0 * RATING_PRIOR_WEIGHT, RATING_PRIOR_WEIGHT), (5.0 + RATING_PRIOR_MEAN) / 2);
  });
});

describe("canShowRating — 표시 임계", () => {
  it("임계 미만은 평점을 띄우지 않는다", () => {
    expect(canShowRating(REVIEW_DISPLAY_MIN_COUNT - 1)).toBe(false);
    expect(canShowRating(0)).toBe(false);
  });

  it("임계와 같으면 띄운다 — 경계는 이상(以上)이다", () => {
    expect(canShowRating(REVIEW_DISPLAY_MIN_COUNT)).toBe(true);
  });
});

describe("applyDisplayThreshold", () => {
  it("미달이면 null 이다 — 0 이 아니다", () => {
    // 0 으로 떨어뜨리면 화면이 '평점 0점'으로 읽는다
    expect(applyDisplayThreshold(4.67, 3)).toBeNull();
  });

  it("충족하면 원본 평균을 그대로 준다 (보정값이 아니다)", () => {
    expect(applyDisplayThreshold(4.6, 47)).toBe(4.6);
  });

  it("표시 임계와 정렬 보정은 서로 독립이다", () => {
    // 후기 3건 주최사는 화면에 평점이 안 뜨지만 정렬에서는 빠지지 않는다
    expect(applyDisplayThreshold(4.67, 3)).toBeNull();
    expect(ratingScore(4.67 * 3, 3)).toBeGreaterThan(0);
  });
});
