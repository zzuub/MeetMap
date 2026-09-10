import { EventCardSkeletonList } from "@/entities/event";
import { Skeleton } from "@/shared/ui";

/**
 * 탐색 로딩 (11.3 `탐색 리스트 → 카드 스켈레톤`).
 *
 * ⚠️ **상단 컨트롤까지 스켈레톤으로 덮는다.** 컨트롤만 진짜로 그려두면 로딩 중에
 * 지역·시간대·필터를 다시 누를 수 있는데, 그 값은 아직 서버에서 안 온 `facets` 를
 * 필요로 해서(0건 항목을 감추는 규칙 6.2) 실제와 다른 목록이 그려진다.
 *
 * 이 폴백이 뜨는 자리는 **최초 진입·새로고침·뒤로가기**뿐이다. 칩·시트·칩 줄 조작은
 * `startTransition` 안의 이동이라 이미 마운트된 경계가 유지되고, P1-5 가 붙여 둔
 * **누른 자리의 표시 셋**(시간대 칩 · `useLinkStatus` · 시트의 `N개 결과 보기`)이
 * 그대로 일한다 → `decisions.md` 4.41.
 */
export function ExploreBoardSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4" aria-busy>
      <span className="sr-only">소개팅을 불러오는 중입니다</span>

      {/* 지역 버튼 */}
      <Skeleton className="h-10 w-40 rounded-chip" />

      {/* 시간대 칩 + 필터 버튼 */}
      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[38px] w-14 rounded-chip" />
        ))}
        <Skeleton className="ml-auto h-[38px] w-20 rounded-chip" />
      </div>

      {/* 결과 수 + 정렬 */}
      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-28 rounded-chip" />
        <Skeleton className="h-4 w-20 rounded-chip" />
      </div>

      <EventCardSkeletonList variant="list" count={SKELETON_CARDS} />
    </div>
  );
}

/**
 * 첫 화면을 채울 만큼만. `PAGE_SIZE`(6)와 맞추지 않는다 — 스크롤 밖의 장수는
 * 사용자가 못 보고, 폴백이 길수록 실제 결과가 짧을 때 밀림이 커진다.
 */
const SKELETON_CARDS = 4;
