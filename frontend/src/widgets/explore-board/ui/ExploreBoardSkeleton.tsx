import { EventCardSkeletonList } from "@/entities/event";
import type { ExploreView } from "@/features/event-filter";
import { MapLoadingOverlay } from "@/features/event-map";
import { Skeleton } from "@/shared/ui";
import { MAP_BOARD_CLASS, MapFrame } from "./MapFrame";

/**
 * 탐색 로딩 (11.3) — **뷰마다 모양이 다르다.** 리스트는 카드 스켈레톤, 지도는 지도 로딩
 * 오버레이다.
 *
 * `view` 가 `null` 이면 **두 뷰에 공통인 윗부분까지만** 그린다 — `loading.tsx` 의 자리다. 그
 * 파일은 인자를 받지 않아(Next 문서 `loading`) 어느 뷰로 가는지 모른다. 뷰를 아는 것은
 * 페이지이고, 페이지의 Suspense 가 같은 윗부분 아래로 나머지를 이어 그린다 (`decisions.md` 4.71).
 *
 * ⚠️ **상단 컨트롤까지 스켈레톤으로 덮는다.** 컨트롤만 진짜로 그려두면 로딩 중에
 * 지역·시간대·필터를 다시 누를 수 있는데, 그 값은 아직 서버에서 안 온 `facets` 를
 * 필요로 해서(0건 항목을 감추는 규칙 6.2) 실제와 다른 목록이 그려진다.
 *
 * 이 폴백이 뜨는 자리는 **최초 진입·새로고침·뒤로가기·다른 탭에서 들어올 때**뿐이다. 칩·시트·
 * 칩 줄·정렬·뷰 토글은 `startTransition` 안의 이동이라 이미 마운트된 경계가 유지되고, 누른
 * 자리의 표시가 대신 일한다 → `decisions.md` 4.41.
 */
export function ExploreBoardSkeleton({ view }: { view: ExploreView | null }) {
  if (view === "map") {
    return (
      <div className={MAP_BOARD_CLASS} aria-busy>
        <ControlsSkeleton sort={false} />
        {/* 오버레이가 `지도를 불러오는 중이에요` 를 읽는다 — 같은 말을 두 번 하지 않는다 */}
        <MapFrame>
          <MapLoadingOverlay />
        </MapFrame>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4" aria-busy>
      <span className="sr-only">소개팅을 불러오는 중입니다</span>

      {/* 뷰를 모를 때도 정렬 자리를 둔다 — 들어오는 길 대부분이 리스트라 그쪽이 튀지 않게 */}
      <ControlsSkeleton sort />

      {view === "list" ? (
        <EventCardSkeletonList variant="list" count={SKELETON_CARDS} />
      ) : null}
    </div>
  );
}

/** 지역 버튼 · 시간대 칩 + 필터 버튼 · 결과 수 + (정렬) + 뷰 토글 */
function ControlsSkeleton({ sort }: { sort: boolean }) {
  return (
    <>
      <Skeleton className="h-10 w-40 rounded-chip" />

      <div className="flex items-center gap-2">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-[38px] w-14 rounded-chip" />
        ))}
        <Skeleton className="ml-auto h-[38px] w-20 rounded-chip" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Skeleton className="h-4 w-28 rounded-chip" />
        <div className="flex items-center gap-2">
          {sort ? <Skeleton className="h-[34px] w-20 rounded-chip" /> : null}
          <Skeleton className="h-[46px] w-[140px] rounded-chip" />
        </div>
      </div>
    </>
  );
}

/**
 * 첫 화면을 채울 만큼만. `PAGE_SIZE`(6)와 맞추지 않는다 — 스크롤 밖의 장수는
 * 사용자가 못 보고, 폴백이 길수록 실제 결과가 짧을 때 밀림이 커진다.
 */
const SKELETON_CARDS = 4;
