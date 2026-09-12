import type { EventCardViewer, EventSummary } from "@/entities/event";
import {
  ExploreFilterBar,
  SortSelect,
  ViewToggle,
  serializeExploreParams,
  type ExploreParams,
  type ExploreFacets,
} from "@/features/event-filter";
import type { CursorPage } from "@/shared/api";
import { EventList } from "./EventList";
import { ExploreEmpty } from "./ExploreEmpty";
import { ResultCount } from "./ResultCount";

interface ExploreBoardProps {
  page: CursorPage<EventSummary>;
  params: ExploreParams;
  facets: ExploreFacets;
  viewer: EventCardViewer | null;
}

/**
 * 탐색 리스트 뷰 — 상단 컨트롤(6.2) + 결과 수·정렬·뷰 토글 + 리스트(6.5).
 *
 * 지도 뷰는 `ExploreMapBoard` 다. 상단 컨트롤은 같고 정렬만 없다 (`decisions.md` 4.71).
 */
export function ExploreBoard({ page, params, facets, viewer }: ExploreBoardProps) {
  const { query } = params;

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <ExploreFilterBar
        params={params}
        resultCount={page.totalCount}
        facets={facets}
      />

      {/* 결과 수와 정렬은 같은 줄이다 (6.2). 정렬은 결과 **집합**이 아니라 순서만 바꾸므로
          이 숫자와 나란히 두어도 어긋나 보이지 않는다. 좁으면 컨트롤이 다음 줄로 내려간다 */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <ResultCount count={page.totalCount} />

        <div className="ml-auto flex items-center gap-2">
          <SortSelect params={params} />
          <ViewToggle params={params} />
        </div>
      </div>

      {page.totalCount === 0 ? (
        <ExploreEmpty params={params} />
      ) : (
        <EventList
          // 조건이 바뀌면 누적분을 버린다 — 이전 조건의 카드가 섞이면 안 된다
          key={serializeExploreParams(params)}
          initial={page}
          query={query}
          viewer={viewer}
        />
      )}
    </div>
  );
}
