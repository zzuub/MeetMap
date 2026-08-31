import { ApiError, emptyPage, type CursorPage } from "@/shared/api";
import { MOCK_LATENCY_MS, ONLY_20S_MAX_AGE } from "@/shared/config";
import { MOCK_EVENTS } from "../mock/events";
import type {
  EventDetail,
  EventListQuery,
  EventSummary,
  HomeFeed,
} from "../model/types";
import type { EventApi } from "./eventApi";

const DEFAULT_LIMIT = 10;

/**
 * 목 구현 (dev-plan P0-6).
 *
 * 서버가 할 일을 흉내낸다 — 필터·정렬·페이지네이션을 메모리에서 처리한다.
 * 정확도가 목적이 아니라 **화면이 실제 응답 형태를 마주하게 하는 것**이 목적이다.
 * 그래서 인위적 지연을 넣고 커서 페이지네이션도 흉내낸다(스켈레톤·무한 스크롤을
 * 개발 중에 실제로 보기 위해).
 */
export const mockEventApi: EventApi = {
  async getHomeFeed() {
    await delay();

    const sorted = [...MOCK_EVENTS];

    return {
      popular: [...sorted].sort((a, b) => b.popularity - a.popularity).slice(0, 6),
      femaleFriendly: [...sorted]
        .sort((a, b) => b.femaleRatio - a.femaleRatio)
        .slice(0, 6),
      openNow: sorted.filter((e) => e.status === "모집중").slice(0, 4),
      baseAreaLabel: "성수동",
    } satisfies HomeFeed;
  },

  async getList(query) {
    await delay();

    const filtered = applyFilters(MOCK_EVENTS, query);
    const sorted = applySort(filtered, query.sort);
    return paginate(sorted, query.cursor ?? null, query.limit ?? DEFAULT_LIMIT);
  },

  async getDetail(id) {
    await delay();

    const found = MOCK_EVENTS.find((event) => event.id === id);
    if (!found) {
      // 실제 404와 같은 형태로 던져야 `not-found.tsx` 경로를 개발 중에 검증할 수 있다.
      throw new ApiError({
        kind: "NOT_FOUND",
        code: "NOTFOUND_404",
        status: 404,
        message: "요청한 행사를 찾을 수 없습니다.",
      });
    }
    return found;
  },

  async getMapMarkers(query) {
    await delay();
    // bbox 는 목에서 무시한다. 필터 결과와 마커 소스가 같아야 한다는 규칙(6.6)만 지킨다.
    return applyFilters(MOCK_EVENTS, query);
  },

  async search(keyword) {
    await delay();

    const q = keyword.trim().toLowerCase();
    if (!q) return [];

    // 검색 대상: 행사명 + 지역 + 카테고리 + 주최사 (11.1)
    return MOCK_EVENTS.filter((event) =>
      [event.title, event.area, event.category, event.provider]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  },

  async logOutboundClick() {
    // 목 모드에서는 아무것도 하지 않는다.
  },
};

/* ── 내부 ───────────────────────────────────────────────── */

function applyFilters(
  events: readonly EventDetail[],
  query: EventListQuery,
): EventSummary[] {
  return events.filter((event) => {
    if (query.district && query.district !== "ALL") {
      if (event.district !== query.district) return false;
    }

    if (query.slot && query.slot !== "ALL" && event.timeSlot !== query.slot) {
      return false;
    }

    if (query.area && event.area !== query.area) return false;

    if (query.mood?.length) {
      // 다중 선택은 OR 조건이다 (6.4)
      const hit = query.mood.some((mood) => event.mood.includes(mood));
      if (!hit) return false;
    }

    if (query.only20s && event.maxAge > ONLY_20S_MAX_AGE) return false;

    // 성별 조건은 의도적으로 구현하지 않는다.
    // 행사 측 `genderPolicy` 필드 정의가 선행되어야 한다 (6.4 / dev-plan blocking #4).
    // 지금 매칭 로직을 추측으로 넣으면 목업과 같은 "항상 0건" 버그를 재현하게 된다.

    return true;
  });
}

function applySort(
  events: EventSummary[],
  sort: EventListQuery["sort"],
): EventSummary[] {
  const sorted = [...events];

  switch (sort) {
    case "latest":
      return sorted.sort((a, b) => b.date.localeCompare(a.date));
    case "priceAsc":
      return sorted.sort((a, b) => a.price - b.price);
    case "priceDesc":
      return sorted.sort((a, b) => b.price - a.price);
    case "popular":
    default:
      return sorted.sort((a, b) => b.popularity - a.popularity);
  }
}

function paginate(
  items: EventSummary[],
  cursor: string | null,
  limit: number,
): CursorPage<EventSummary> {
  if (items.length === 0) return emptyPage();

  const start = cursor ? Number(cursor) : 0;
  if (Number.isNaN(start)) return emptyPage();

  const slice = items.slice(start, start + limit);
  const nextIndex = start + slice.length;

  return {
    items: slice,
    nextCursor: nextIndex < items.length ? String(nextIndex) : null,
    totalCount: items.length,
  };
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
