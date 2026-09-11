/** 근거: docs/spec/09-검색-공통상태.md 11.1 · 계약은 `shared/api/endpoints.ts` 의 `search.trending` */

/**
 * 인기 검색어 한 줄.
 *
 * **순위는 배열 위치다** — 필드로 싣지 않는다. 화면이 파생시킬 수 있는 값을 따로 받으면
 * 둘이 어긋날 경로가 생긴다 (`decisions.md` 4.35 1단 · 4.68).
 */
export interface TrendingKeyword {
  keyword: string;
  /** 직전 스냅샷의 순위(1부터). 직전 순위표에 없었으면 `null` — 화면은 `new` 로 쓴다 */
  previousRank: number | null;
}

export interface TrendingSnapshot {
  /** 집계 기준 시각. ISO 8601 이고 오프셋을 포함한다(`Z` 또는 `+09:00`) */
  baseAt: string;
  /** 순위 순서. 1위가 `[0]` 이다 */
  keywords: TrendingKeyword[];
}
