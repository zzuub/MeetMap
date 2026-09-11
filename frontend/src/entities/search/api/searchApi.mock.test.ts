import { describe, expect, it, vi } from "vitest";
import { trendChange } from "../model/change";
import { mockSearchApi } from "./searchApi.mock";

/**
 * 목 인기 검색어가 **계약의 모양**을 지키는가 (`ENDPOINTS.search.trending` · `decisions.md` 4.68).
 *
 * 목 키워드가 실제로 결과를 내는지는 여기서 못 본다 — 회차는 다른 entity 다. 그 검사는
 * `app/_consistency/trendingKeywords.test.ts` 가 한다 (4.21 의 자리).
 */
describe("목 인기 검색어 — 계약의 모양", () => {
  it("6개 이하이고 검색어가 겹치지 않는다", async () => {
    const { keywords } = await mockSearchApi.getTrending();

    expect(keywords.length).toBeGreaterThan(0);
    expect(keywords.length).toBeLessThanOrEqual(6);
    expect(new Set(keywords.map((item) => item.keyword)).size).toBe(keywords.length);
  });

  it("직전 순위는 1 이상의 정수이고 서로 겹치지 않는다 — 한 스냅샷의 순위표다", async () => {
    const { keywords } = await mockSearchApi.getTrending();
    const previous = keywords.flatMap((item) => item.previousRank ?? []);

    for (const rank of previous) {
      expect(Number.isInteger(rank) && rank >= 1, `직전 순위 ${rank}`).toBe(true);
    }
    expect(new Set(previous).size).toBe(previous.length);
  });

  it("증감 네 종류가 전부 섞여 있다 — 화면이 네 모양을 다 그려 보게", async () => {
    const { keywords } = await mockSearchApi.getTrending();
    const kinds = new Set(keywords.map((item, index) => trendChange(index + 1, item.previousRank).kind));

    expect(kinds).toEqual(new Set(["up", "down", "same", "new"]));
  });

  it("기준 시각은 오프셋이 붙은 ISO 이고 지금 직전의 정시다", async () => {
    // 목 지연(`setTimeout`)은 그대로 두고 시계만 고정한다
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      vi.setSystemTime(new Date("2026-09-11T10:42:30+09:00"));
      const { baseAt } = await mockSearchApi.getTrending();

      expect(baseAt).toMatch(/(Z|[+-]\d{2}:\d{2})$/);
      expect(Date.parse(baseAt)).toBe(Date.parse("2026-09-11T10:00:00+09:00"));
    } finally {
      vi.useRealTimers();
    }
  });

  it("돌려받은 것을 고쳐도 다음 조회에 새지 않는다", async () => {
    const first = await mockSearchApi.getTrending();
    const original = first.keywords[0].keyword;
    first.keywords[0].keyword = "바뀐 검색어";

    const again = await mockSearchApi.getTrending();
    expect(again.keywords[0].keyword).toBe(original);
  });
});
