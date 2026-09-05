import { getServerSession } from "@/entities/account/server";
import { eventApi } from "@/entities/event";
import {
  countBySlot,
  parseExploreParams,
  type RawSearchParams,
} from "@/features/event-filter";
import { ExploreBoard } from "@/widgets/explore-board";
import { PhasePlaceholder } from "../../_components/PhasePlaceholder";

/**
 * 탐색 `/explore` (기능정의서 6장).
 *
 * **URL 이 필터 상태의 원본이다** (2.4). 페이지는 쿼리스트링을 조회 파라미터로
 * 옮기기만 하고 상태를 들지 않는다 — 새로고침·뒤로가기·공유가 그래서 그냥 된다.
 */
export default async function ExplorePage({
  searchParams,
}: {
  // Next 16 에서 Promise 다 (session-handoff 4장)
  searchParams: Promise<RawSearchParams>;
}) {
  const [session, raw] = await Promise.all([getServerSession(), searchParams]);
  const params = parseExploreParams(raw, { isGuest: session === null });

  if (params.view === "map") {
    return <PhasePlaceholder title="지도 뷰" phase="Phase 3 · P3-1" spec="6.6" />;
  }

  // 시간대 칩은 건수 0인 슬롯을 감춰야 해서 목록과 함께 슬롯별 건수를 받는다 (6.2)
  const [page, slotCounts] = await Promise.all([
    eventApi.getList({ ...params.query, limit: PAGE_SIZE }),
    countBySlot(params.query),
  ]);

  // viewer 는 프로필에서 온다. 목 세션에 출생연도·성별이 없어 P2-4 까지 null 이다
  return (
    <ExploreBoard page={page} params={params} slotCounts={slotCounts} viewer={null} />
  );
}

/**
 * 한 번에 받는 건수.
 *
 * 목 8건에서 **다음 페이지를 실제로 눌러볼 수 있어야** 해서 8보다 작게 잡았다.
 * 실 API 의 적정값은 응답 크기를 보고 정한다 — 16장.
 */
const PAGE_SIZE = 6;
