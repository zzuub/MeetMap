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
