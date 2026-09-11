import { isSameSearchKeyword, normalizeSearchKeyword } from "@/entities/event";
import { RECENT_KEYWORDS_MAX } from "@/shared/config";

/**
 * 최근 검색어 목록의 순수 규칙 (11.1 · `decisions.md` 4.69) — 저장소와 떼어 둔다.
 *
 * 합치는 규칙은 하나다: **정규화한 뒤 대소문자를 무시해 같으면 같은 검색어**이고,
 * 가장 최근 표기를 맨 앞에 남긴다. 정규화는 검색·주소와 같은 함수다.
 */

/** 맨 앞에 넣고, 같은 검색어는 빼고, 상한에서 자른다. 빈 검색어면 그대로 */
export function withRecentKeyword(
  list: readonly string[],
  keyword: string,
  max = RECENT_KEYWORDS_MAX,
): string[] {
  const normalized = normalizeSearchKeyword(keyword);
  if (normalized === null) return [...list];

  return [normalized, ...list.filter((item) => !isSameSearchKeyword(item, normalized))].slice(
    0,
    max,
  );
}

export function withoutRecentKeyword(list: readonly string[], keyword: string): string[] {
  return list.filter((item) => !isSameSearchKeyword(item, keyword));
}

/**
 * 저장소의 문자열 → 목록. **무엇이 들어 있어도 던지지 않는다** — 옛 버전의 코드나
 * 개발자도구로 고친 값이 들어 있을 수 있다. 문자열이 아닌 것은 버리고, 같은 규칙으로
 * 다시 합치고(앞의 것이 최근이다), 상한에서 자른다.
 */
export function parseStoredKeywords(raw: string | null, max = RECENT_KEYWORDS_MAX): string[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const keywords: string[] = [];
  for (const item of parsed) {
    if (typeof item !== "string") continue;

    const normalized = normalizeSearchKeyword(item);
    if (normalized === null) continue;
    if (keywords.some((kept) => isSameSearchKeyword(kept, normalized))) continue;

    keywords.push(normalized);
  }

  return keywords.slice(0, max);
}
