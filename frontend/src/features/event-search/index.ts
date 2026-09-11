/**
 * 검색 (11.1 — P2-9).
 *
 * 검색어는 URL(`?q=`)이 원본이고 조회는 페이지가 서버에서 한다 (`decisions.md` 4.66).
 * 이 슬라이스는 **입력 · 최근 검색어 · 인기/추천 검색어 칩**을 맡는다. 이 화면의 주소를
 * 바꾸는 자리는 `SearchProvider` 하나다.
 */
export { SEARCH_COPY, emptyResultTitle } from "./model/copy";
export {
  SEARCH_PATH,
  parseSearchParams,
  searchHref,
  type RawSearchParams,
} from "./model/searchParams";
export { suggestKeywords } from "./model/suggestions";
export { KeywordSuggestions } from "./ui/KeywordSuggestions";
export { RecentKeywords } from "./ui/RecentKeywords";
export { RememberOnResultClick } from "./ui/RememberOnResultClick";
export { SearchAgainButton } from "./ui/SearchAgainButton";
export { SearchInput } from "./ui/SearchField";
export { SearchPending } from "./ui/SearchPending";
export { SearchProvider } from "./ui/SearchProvider";
export { TrendingKeywords } from "./ui/TrendingKeywords";
