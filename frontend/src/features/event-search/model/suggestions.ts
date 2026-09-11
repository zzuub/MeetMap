import { isSameSearchKeyword } from "@/entities/event";
import type { TrendingSnapshot } from "@/entities/search";
import { SEARCH_SUGGESTIONS_MAX } from "@/shared/config";

/**
 * 결과 없음의 추천 검색어 (11.1 · 11.2) — **인기 검색어 앞에서부터**, 지금 검색어는 빼고.
 *
 * 고정 칩(`강남 / 성수 / 홍대 / 심야`)을 쓰지 않는 이유는 `decisions.md` 4.68 — 인기
 * 검색어는 **결과가 있는 것만 온다**는 계약이라 누르면 0건인 추천이 생기지 않는다.
 * 지금 검색어를 빼는 것은 같은 0건으로 되돌아가는 칩을 막으려는 것이다.
 */
export function suggestKeywords(
  trending: TrendingSnapshot | null,
  current: string,
  max = SEARCH_SUGGESTIONS_MAX,
): string[] {
  if (trending === null) return [];

  return trending.keywords
    .map((item) => item.keyword)
    .filter((keyword) => !isSameSearchKeyword(keyword, current))
    .slice(0, max);
}

/**
 * 이 검색어가 지금 인기 검색어에 있는가 — **결과 없음 화면에서만** 묻는다.
 *
 * 인기 검색어는 결과가 있는 것만 온다는 계약이다(`ENDPOINTS.search.trending` 5번). 그런데
 * 스냅샷과 클릭 사이에 결과가 사라지면(삭제·숨김) 화면은 막을 수단이 없다 — 막으려면 인기
 * 검색어마다 검색을 한 번 더 돌려야 한다. 그래서 **막지 않고 관측한다**: 0건을 낸 검색어가
 * 인기 검색어에 있으면 계약 위반이다 (`decisions.md` 4.68 리뷰 반영).
 *
 * 화면이 보여 주는 Top 6 가 아니라 **실려 온 목록 전체**를 본다 — 계약은 목록 전체에 걸린다.
 */
export function isTrending(trending: TrendingSnapshot | null, keyword: string): boolean {
  return trending?.keywords.some((item) => isSameSearchKeyword(item.keyword, keyword)) ?? false;
}
