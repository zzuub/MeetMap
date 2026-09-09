import type { EventCardViewer, EventSummary } from "@/entities/event";
import {
  ExploreFilterBar,
  SortSelect,
  emptyRelaxation,
  serializeExploreParams,
  type ExploreParams,
  type ExploreFacets,
} from "@/features/event-filter";
import type { CursorPage } from "@/shared/api";
import { ActionLink, EmptyState, Numeric } from "@/shared/ui";
import { EventList } from "./EventList";

interface ExploreBoardProps {
  page: CursorPage<EventSummary>;
  params: ExploreParams;
  facets: ExploreFacets;
  viewer: EventCardViewer | null;
}

/**
 * 탐색 리스트 뷰 — 상단 컨트롤(6.2) + 결과 수·정렬 + 리스트(6.5).
 *
 * **뷰 토글(`리스트 / 지도`)은 아직 없다.** 지도가 P3-1 이라 세그먼트의 절반이 매번
 * 자리표시자로 가는 컨트롤이 된다 — 누르면 아무 일도 안 일어나는 컨트롤을 그리지
 * 않는다는 홈의 옛 퀵 필터 칩(5.4)과 같은 규칙이다 (`decisions.md` 4.29).
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
          이 숫자와 나란히 두어도 어긋나 보이지 않는다 */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] text-text-sub">
          총 <Numeric className="font-bold text-text">{page.totalCount}</Numeric>개 소개팅
        </p>

        <SortSelect params={params} />
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

/**
 * 필터 결과 없음 (11.2).
 *
 * **문구로 끝내지 않고 다음 행동을 준다.** 그 액션이 상수가 아닌 이유는
 * `emptyRelaxation` 에 있다 — 칩이 하나도 없는 0건에서 `필터 초기화` 는 아무것도
 * 바꾸지 않는 링크가 된다.
 *
 * **적용 필터 칩 줄을 여기서 다시 그리지 않는다** — 6.2 가 상시 노출하므로 같은
 * 정보가 두 번 뜬다 (11.2 명시).
 */
function ExploreEmpty({ params }: { params: ExploreParams }) {
  const relaxation = emptyRelaxation(params);

  // 걸린 조건이 없는데 0건이면 "필터를 풀어보세요"가 거짓말이다 — 풀 것이 없다
  if (relaxation === null) {
    return (
      <EmptyState
        icon="🌱"
        title="아직 등록된 소개팅이 없어요"
        description="새 소개팅이 올라오면 여기에서 바로 볼 수 있어요"
      />
    );
  }

  return (
    <EmptyState
      icon="🔍"
      title="조건에 맞는 소개팅이 없어요"
      description="적용한 필터를 하나씩 풀어보면 더 많은 소개팅을 볼 수 있어요"
      action={
        <ActionLink href={relaxation.href} replace scroll={false}>
          {relaxation.label}
        </ActionLink>
      }
    />
  );
}
