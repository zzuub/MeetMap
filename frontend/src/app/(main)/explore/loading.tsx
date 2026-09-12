import { ExploreBoardSkeleton } from "@/widgets/explore-board";

/**
 * 탐색 로딩 폴백 (11.3) — **두 뷰에 공통인 윗부분까지만** 그린다.
 *
 * 리스트와 지도는 폴백 모양이 다른데(카드 / 지도 로딩 오버레이) 이 파일은 쿼리를 못 본다 —
 * `loading` 은 인자를 받지 않는다(Next 문서). 여기서 카드를 그리면 지도로 들어가는 사람이
 * 카드 스켈레톤을 본다. 뷰를 아는 페이지의 Suspense 가 나머지를 이어 그린다 (`decisions.md` 4.71).
 *
 * 이 파일을 지우지 않는 이유는 **즉시성**이다 — 폴백이 미리 받아져 있어 다른 탭에서 누르는
 * 순간 뜬다. 지우면 첫 응답까지 아무 표시가 없다.
 */
export default function ExploreLoading() {
  return <ExploreBoardSkeleton view={null} />;
}
