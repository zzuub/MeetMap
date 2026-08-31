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
