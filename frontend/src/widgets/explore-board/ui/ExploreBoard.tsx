import type { EventCardViewer, EventListQuery, EventSummary } from "@/entities/event";
import { serializeExploreParams } from "@/features/event-filter";
import type { CursorPage } from "@/shared/api";
import { EmptyState, Numeric } from "@/shared/ui";
import { EventList } from "./EventList";

interface ExploreBoardProps {
  page: CursorPage<EventSummary>;
  query: EventListQuery;
  viewer: EventCardViewer | null;
}

/**
 * 탐색 리스트 뷰 (6.2 결과 수 + 6.5 리스트).
 *
 * 상단 컨트롤(지역 버튼·시간대 칩·필터·정렬·뷰 토글)은 아직 없다 — P1-5·P1-5b·P1-6
 * 이 각각 붙는 자리다. 지금 자리표시자를 그려두지 않는 것은 누르면 아무 일도 안
 * 일어나는 컨트롤이 홈의 옛 퀵 필터 칩과 같은 실수이기 때문이다 (5.4).
 */
export function ExploreBoard({ page, query, viewer }: ExploreBoardProps) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
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
          key={serializeExploreParams({ view: "list", query })}
          initial={page}
          query={query}
          viewer={viewer}
        />
      )}
    </div>
  );
}
