import { normalizeSearchKeyword } from "@/entities/event";

/**
 * 검색 주소 ↔ 검색어 (11.1 · `decisions.md` 4.66).
 *
 * **URL 이 검색어의 원본이다** (2.4). 탐색의 `exploreParams` 와 같은 자리이고 규칙도
 * 같다 — 알 수 없는 값은 에러가 아니라 기본값(`idle`)으로 떨어뜨리고, 주소는 손으로
 * 조립하지 않는다(`searchHref` 를 거친다).
 */

/** Next 의 `searchParams` 가 주는 모양 그대로 받는다 */
export type RawSearchParams = Record<string, string | string[] | undefined>;

export const SEARCH_PATH = "/search";
export const SEARCH_QUERY_KEY = "q";

/**
 * 공백만 들어온 `?q=%20%20` 도 검색어가 없는 것이다 — 목과 **같은 함수**로 판정한다.
 * 같은 키가 둘이면(`?q=a&q=b`) 첫 값만 쓴다.
 */
export function parseSearchParams(params: RawSearchParams): { keyword: string | null } {
  const raw = params[SEARCH_QUERY_KEY];
  return { keyword: keywordFrom(Array.isArray(raw) ? raw[0] : raw) };
}

/** `useSearchParams().get("q")` 로 읽은 값에도 같은 규칙을 쓴다 */
export function keywordFrom(value: string | null | undefined): string | null {
  return value == null ? null : normalizeSearchKeyword(value);
}

/**
 * 검색 화면의 주소. **이동은 전부 이 함수를 거친다.** 정규화해서 싣는다 — 공백을 그대로
 * 실으면 새로고침했을 때 화면은 `idle` 인데 주소에는 `q` 가 남는 어긋난 상태가 된다.
 */
export function searchHref(keyword: string | null): string {
  const normalized = keywordFrom(keyword);
  if (normalized === null) return SEARCH_PATH;

  return `${SEARCH_PATH}?${new URLSearchParams({ [SEARCH_QUERY_KEY]: normalized })}`;
}
