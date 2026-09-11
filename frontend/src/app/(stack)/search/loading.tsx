import { SearchBoardSkeleton } from "@/widgets/search-board";

/**
 * 검색 로딩 폴백 (11.3). 로딩은 화면마다 둔다 (`decisions.md` 4.41).
 *
 * 헤더와 입력창은 `layout.tsx` 에 있어 여기서 그리지 않는다 — 조회를 기다리는 동안에도
 * 칠 수 있다 (4.66).
 */
export default function SearchLoading() {
  return <SearchBoardSkeleton />;
}
