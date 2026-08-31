/**
 * API 공통 형태.
 * 커서 페이지네이션은 dev-plan blocking #7 기본안(커서 + 무한 스크롤)을 따른다.
 */

export interface CursorPage<T> {
  items: T[];
  /** 다음 페이지 커서. `null` 이면 마지막 페이지다. */
  nextCursor: string | null;
  /** 전체 건수. 탐색 화면의 `총 N개 모임` 표기에 쓴다 (6.2). */
  totalCount: number;
}

export function emptyPage<T>(): CursorPage<T> {
  return { items: [], nextCursor: null, totalCount: 0 };
}

/**
 * 메모리 배열을 커서 페이지로 자른다.
 *
 * 커서는 **다음 페이지의 시작 인덱스를 담은 문자열**이다. 서버가 불투명(opaque)
 * 커서를 쓰더라도 클라이언트는 값을 해석하지 않고 그대로 되돌려주므로, 목 구현이
 * 인덱스를 쓰는 것은 계약을 어기지 않는다.
 *
 * 목 API 가 서버의 페이지네이션을 흉내내는 데 쓴다. 각 entity 의 목 구현이
 * 같은 로직을 복붙하지 않도록 여기에 둔다.
 */
export function paginateArray<T>(
  items: readonly T[],
  cursor: string | null,
  limit: number,
): CursorPage<T> {
  if (items.length === 0) return emptyPage<T>();

  // 잘못된 커서는 빈 페이지로 떨어뜨린다. 0 으로 되돌리면 사용자가
  // 무한 스크롤 중 첫 페이지로 되돌아가 같은 항목을 다시 보게 된다.
  const start = cursor === null ? 0 : Number(cursor);
  if (!Number.isInteger(start) || start < 0) return emptyPage<T>();

  const page = items.slice(start, start + limit);
  const nextIndex = start + page.length;

  return {
    items: [...page],
    nextCursor: nextIndex < items.length ? String(nextIndex) : null,
    totalCount: items.length,
  };
}
