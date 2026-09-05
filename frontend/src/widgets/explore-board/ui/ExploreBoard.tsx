import type { EventCardViewer, EventSummary } from "@/entities/event";
import {
  ExploreFilterBar,
  serializeExploreParams,
  type ExploreParams,
  type ExploreFacets,
} from "@/features/event-filter";
import type { CursorPage } from "@/shared/api";
import { EmptyState, Numeric } from "@/shared/ui";
import { EventList } from "./EventList";

interface ExploreBoardProps {
  page: CursorPage<EventSummary>;
  params: ExploreParams;
  facets: ExploreFacets;
  viewer: EventCardViewer | null;
}

/**
 * 탐색 리스트 뷰 — 상단 컨트롤(6.2) + 결과 수 + 리스트(6.5).
 *
 * 아직 없는 것: 정렬 `select`·뷰 토글(P1-6). 자리표시자를
 * 그려두지 않는다 — 누르면 아무 일도 안 일어나는 컨트롤은 홈의 옛 퀵 필터 칩과 같은
 * 실수다 (5.4).
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

      <p className="text-[13px] text-text-sub">
        총 <Numeric className="font-bold text-text">{page.totalCount}</Numeric>개 소개팅
      </p>

      {page.totalCount === 0 ? (
        <EmptyState
          icon="🔍"
          title="조건에 맞는 소개팅이 없어요"
          description="필터를 조정해 다시 찾아보세요"
        />
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
