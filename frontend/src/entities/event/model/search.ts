import type { EventSummary } from "./types";

/**
 * 검색어 정규화 (11.1) — 앞뒤 공백을 떼고 연속 공백을 한 칸으로. 남는 것이 없으면 `null`.
 *
 * **검색의 모든 자리가 이 함수 하나를 본다** — 목의 판정, 주소(`?q=`) 파싱, 최근 검색어
 * 합치기. 화면이 `idle` 로 보는 입력을 목이 `empty` 로 답하면(공백만 친 경우) 같은 글자에
 * 두 화면이 나온다 (`decisions.md` 4.66 표 7번).
 *
 * 대소문자는 여기서 바꾸지 않는다 — 비교하는 자리가 무시하고(`isSameSearchKeyword`),
 * 화면에는 사용자가 친 표기가 남아야 한다.
 */
export function normalizeSearchKeyword(raw: string): string | null {
  const keyword = raw.trim().replace(/\s+/g, " ");
  return keyword === "" ? null : keyword;
}

/**
 * 회차가 검색어에 걸리는가 (11.1) — 소개팅명 · 지역 · 주최사명 **각각**의 부분 문자열이고
 * 대소문자를 무시한다. 서버가 할 일을 목이 흉내 내는 자리라 규칙을 여기 떼어 둔다
 * (`ENDPOINTS.event.search` 요구사항 1). 필드를 이어 붙인 문자열에서 찾으면 경계를 넘는
 * 일치(`… 7:7 성수`)가 생긴다.
 */
export function matchesSearchKeyword(
  event: Pick<EventSummary, "title" | "area" | "provider">,
  keyword: string,
): boolean {
  const q = normalizeSearchKeyword(keyword)?.toLowerCase();
  if (!q) return false;

  return [event.title, event.area, event.provider.name].some((field) =>
    field.toLowerCase().includes(q),
  );
}

/**
 * 같은 검색어인가 — 정규화한 뒤 **대소문자를 무시한다.** 검색이 대소문자를 무시하므로
 * `Bar` 와 `bar` 는 같은 결과를 내는 같은 검색어다 (최근 검색어 중복 · 추천 제외 — 4.68·4.69).
 */
export function isSameSearchKeyword(a: string, b: string): boolean {
  return keyOf(a) === keyOf(b);
}

function keyOf(keyword: string): string {
  return (normalizeSearchKeyword(keyword) ?? "").toLowerCase();
}
