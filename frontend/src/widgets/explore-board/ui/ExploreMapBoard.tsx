import type { EventSummary } from "@/entities/event";
import {
  ExploreFilterBar,
  ViewToggle,
  exploreHref,
  type ExploreFacets,
  type ExploreParams,
} from "@/features/event-filter";
import { EventMap } from "@/features/event-map";
import { ExploreEmpty } from "./ExploreEmpty";
import { MAP_BOARD_CLASS, MapFrame } from "./MapFrame";
import { ResultCount } from "./ResultCount";

interface ExploreMapBoardProps {
  /** 조건의 결과 **전건** — `getMapMarkers` 에 bbox 를 보내지 않는다 (`decisions.md` 4.71) */
  events: EventSummary[];
  params: ExploreParams;
  facets: ExploreFacets;
}

/**
 * 탐색 지도 뷰 (6.6) — 상단 컨트롤(6.2)은 리스트와 같고 **정렬만 없다.**
 *
 * 정렬은 지도에서 보이는 것을 바꾸지 않는다 — 누르면 아무 일도 없는 컨트롤이 된다 (4.29).
 * 값은 URL 에 남아 리스트로 돌아가면 그 순서다 (`viewChoices`).
 *
 * **0건이면 지도를 부르지 않는다.** 빈 지도는 보여 줄 것이 없고, 리스트와 같은 빈 상태가
 * 풀 조건 하나(`emptyRelaxation`)를 준다 (11.2).
 */
export function ExploreMapBoard({ events, params, facets }: ExploreMapBoardProps) {
  return (
    <div className={MAP_BOARD_CLASS}>
      <ExploreFilterBar params={params} resultCount={events.length} facets={facets} />

      <div className="flex items-center justify-between gap-3">
        <ResultCount count={events.length} />
        <ViewToggle params={params} />
      </div>

      <MapFrame>
        {events.length === 0 ? (
          <ExploreEmpty params={params} />
        ) : (
          <EventMap events={events} listHref={exploreHref({ ...params, view: "list" })} />
        )}
      </MapFrame>
    </div>
  );
}
