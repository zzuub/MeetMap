import { describe, expect, it } from "vitest";
import { REVIEW_DISPLAY_MIN_COUNT } from "@/shared/config";
import { MOCK_PROVIDERS } from "./providers";

/**
 * 목 주최사 데이터가 화면이 마주쳐야 할 경계를 실제로 들고 있는지 지킨다.
 *
 * `eventApi.mock.test.ts` 의 목 데이터 검사와 같은 역할이다 — 데이터를 손보다가
 * 경계값이 조용히 사라지면 빈 상태·미달 UI 가 개발 중에 한 번도 안 보인다.
 */
describe("MOCK_PROVIDERS", () => {
  it("주최사가 4곳이고 id 가 중복되지 않는다", () => {
    expect(MOCK_PROVIDERS).toHaveLength(4);
    expect(new Set(MOCK_PROVIDERS.map((p) => p.id)).size).toBe(4);
  });

  it("표시 임계를 넘는 주최사와 미달인 주최사가 모두 있다", () => {
    expect(MOCK_PROVIDERS.some((p) => p.rating !== null)).toBe(true);
    expect(MOCK_PROVIDERS.some((p) => p.rating === null && p.reviewCount > 0)).toBe(true);
    // 후기가 아예 없는 신규 주최사 — 정렬에서 중간에 놓이는지 보는 케이스
    expect(MOCK_PROVIDERS.some((p) => p.reviewCount === 0)).toBe(true);
  });

  it("rating 이 null 인 것과 후기 건수가 서로 어긋나지 않는다", () => {
    for (const provider of MOCK_PROVIDERS) {
      const shown = provider.rating !== null;
      expect(shown).toBe(provider.reviewCount >= REVIEW_DISPLAY_MIN_COUNT);
    }
  });

  it("표본 적은 고득점이 표본 많은 고득점을 이기지 않는다", () => {
    // prv-003 은 원본 평균 4.67 로 prv-001(4.6)보다 높지만 후기가 3건뿐이다.
    // 이 데이터가 6.2 의 보정 규칙을 눈으로 확인하는 자리다.
    const rotationSeoul = byId("prv-001");
    const tableForTen = byId("prv-003");

    expect(tableForTen.rating).toBeNull();
    expect(rotationSeoul.rating).toBe(4.6);
    expect(tableForTen.ratingScore).toBeLessThan(rotationSeoul.ratingScore);
  });

  it("후기 0건 주최사가 최하위가 아니다", () => {
    const scores = MOCK_PROVIDERS.map((p) => p.ratingScore);
    const newcomer = byId("prv-004").ratingScore;

    expect(newcomer).toBeGreaterThan(Math.min(...scores));
    expect(newcomer).toBeLessThan(Math.max(...scores));
  });

  it("인스타 링크가 실제 계정을 가리키지 않는다", () => {
    // 목 데이터가 남의 계정으로 트래픽을 보내면 안 된다
    for (const provider of MOCK_PROVIDERS) {
      expect(provider.instagramUrl).toContain("example.com");
    }
  });

  it("소개 본문이 아직 없는 주최사가 있다", () => {
    // 컨택 직후라 소개를 못 받은 상태. 화면이 null 을 견뎌야 한다 (7.4)
    expect(MOCK_PROVIDERS.some((p) => p.description === null)).toBe(true);
  });
});

function byId(id: string) {
  const found = MOCK_PROVIDERS.find((provider) => provider.id === id);
  if (!found) throw new Error(`목 주최사에 ${id} 가 없다`);
  return found;
}
