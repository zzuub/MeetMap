/**
 * 검색 결과 제목의 키워드 하이라이트용 분할 (11.1).
 *
 * 문자열을 `{ text, matched }` 조각으로 쪼개 돌려준다. HTML을 만들지 않는 이유는
 * `dangerouslySetInnerHTML` 을 쓰지 않기 위해서다 — 소개팅명은 주최사가 넣는
 * 외부 입력이라 XSS 경로가 된다.
 */
export interface HighlightPart {
  text: string;
  matched: boolean;
}

export function highlightKeyword(
  source: string,
  keyword: string,
): HighlightPart[] {
  const trimmed = keyword.trim();
  if (!trimmed) return [{ text: source, matched: false }];

  const parts: HighlightPart[] = [];
  const lowerSource = source.toLowerCase();
  const lowerKeyword = trimmed.toLowerCase();

  let cursor = 0;

  while (cursor < source.length) {
    const found = lowerSource.indexOf(lowerKeyword, cursor);

    if (found === -1) {
      parts.push({ text: source.slice(cursor), matched: false });
      break;
    }

    if (found > cursor) {
      parts.push({ text: source.slice(cursor, found), matched: false });
    }

    parts.push({
      text: source.slice(found, found + trimmed.length),
      matched: true,
    });

    cursor = found + trimmed.length;
  }

  return parts;
}
