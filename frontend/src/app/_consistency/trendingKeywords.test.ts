import { describe, expect, it } from "vitest";
import { eventApi } from "@/entities/event";
import { searchApi } from "@/entities/search";

/**
 * **목 인기 검색어가 실제로 결과를 내는지** 본다 (`decisions.md` 4.68 · 4.21 의 자리).
 *
 * 누르면 0건인 인기 검색어는 4.42 가 금지한 모양이다 — 누르라고 권한 길이 빈 화면으로
 * 간다. 결과 없음 화면의 추천 칩도 이 목록에서 오므로(`suggestKeywords`) **여기 하나가 두
 * 자리를 막는다.** 검색어를 사람이 세지 않는다 — 목이 주는 것을 전부 훑는다.
 *
 * 인기 검색어는 `entities/search`, 회차는 `entities/event` 라 둘을 함께 볼 수 있는 자리가
 * `app` 뿐이다. 슬라이스 내부가 아니라 **공개 API 로만** 접근한다 (`eventArea.test.ts` 와 같다).
 */
describe("목 인기 검색어는 전부 결과를 낸다", () => {
  it("검색어마다 1건 이상", async () => {
    const { keywords } = await searchApi.getTrending();

    // 목록이 비면 아래 단언이 공허하게 통과한다 (`_guard.test.ts` 와 같은 자기 점검)
    expect(keywords.length).toBeGreaterThan(0);

    const counts = await Promise.all(
      keywords.map(async ({ keyword }) => ({
        keyword,
        count: (await eventApi.search(keyword)).length,
      })),
    );

    expect(
      counts.filter(({ count }) => count === 0).map(({ keyword }) => keyword),
      "누르면 0건인 인기 검색어",
    ).toEqual([]);
  });
});
