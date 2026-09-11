import { MOCK_LATENCY_MS } from "@/shared/config";
import type { SearchApi } from "../model/ports";
import type { TrendingKeyword } from "../model/types";

const HOUR_MS = 60 * 60 * 1000;

/**
 * 목 인기 검색어 6개 (P2-9).
 *
 * ⚠️ **목 회차의 제목·지역·주최사에서 골랐다.** 누르면 0건인 인기 검색어는 계약 위반이다
 * (`ENDPOINTS.search.trending` · `decisions.md` 4.68). `app/_consistency/trendingKeywords.test.ts`
 * 가 하나하나 `eventApi.search` 로 결과를 확인하므로 목 회차를 바꾸면 거기가 깨진다.
 * 목업의 `성수 와인`·`러닝 크루` 는 2026-09-01 재정의 전 도메인이라 쓰지 않았다.
 *
 * 증감 네 종류가 전부 나오게 적었다 — `—` · `+1` · `-1` · `new` · `+3` · `-2`.
 */
const TRENDING: readonly TrendingKeyword[] = [
  { keyword: "성수", previousRank: 1 },
  { keyword: "강남", previousRank: 3 },
  { keyword: "홍대", previousRank: 2 },
  { keyword: "로테이션서울", previousRank: null },
  { keyword: "브런치", previousRank: 8 },
  { keyword: "한남", previousRank: 4 },
];

export const mockSearchApi: SearchApi = {
  async getTrending() {
    await delay();

    return {
      // 직전 정시. KST 는 정수 시간 오프셋이라 UTC 로 내림해도 KST 정시다.
      // `Z` 로 주는 것은 일부러다 — 계약은 오프셋을 둘 다 허용한다 (4.68)
      baseAt: new Date(Math.floor(Date.now() / HOUR_MS) * HOUR_MS).toISOString(),
      keywords: TRENDING.map((item) => ({ ...item })),
    };
  },
};

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
