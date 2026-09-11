import type { TrendingSnapshot } from "./types";

/**
 * 검색어 집계 계약 (port). 형태는 `EventApi`·`GeoApi` 와 같다 — 계약은 `model/`,
 * 구현은 `api/`, 분기는 `api/searchApi.ts` 마지막 한 줄 (4.3).
 *
 * ⚠️ **검색 실행은 여기 없다.** 회차를 돌려주는 `/events/search` 는 `eventApi.search` 다.
 * 이 슬라이스는 검색어 **자체**의 통계(`/search/*`)만 맡는다 (`decisions.md` 4.68).
 */
export interface SearchApi {
  /**
   * 인기 검색어 (11.1). **지금 검색하면 1건 이상 나오는 검색어만** 온다 — 누르면
   * 0건인 인기 검색어는 계약 위반이다. 전문은 `ENDPOINTS.search.trending`
   */
  getTrending(): Promise<TrendingSnapshot>;
}
