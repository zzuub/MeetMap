import { ExploreBoardSkeleton } from "@/widgets/explore-board";

/**
 * 탐색 로딩 폴백 (11.3).
 *
 * `/explore` 는 조회가 셋이다 — 목록 + 패싯 2회(6.2·6.3의 0건 감추기). 셋이 다
 * 와야 상단 컨트롤을 그릴 수 있어서 부분 렌더가 성립하지 않는다.
 */
export default function ExploreLoading() {
  return <ExploreBoardSkeleton />;
}
