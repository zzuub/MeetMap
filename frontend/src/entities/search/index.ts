/**
 * 검색어 집계 (11.1 인기 검색어 — P2-9).
 *
 * 검색 **실행**은 `entities/event` 의 `eventApi.search` 다. 이 슬라이스는 검색어의
 * 통계만 맡는다 (`decisions.md` 4.68). 쿠키를 쓰지 않아 `server.ts` 가 없다.
 */
export { searchApi } from "./api/searchApi";
export { trendChange, trendChangeLabel, type TrendChange } from "./model/change";
export type { SearchApi } from "./model/ports";
export type { TrendingKeyword, TrendingSnapshot } from "./model/types";
