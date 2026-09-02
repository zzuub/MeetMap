import { ApiError, paginateArray } from "@/shared/api";
import { MOCK_LATENCY_MS } from "@/shared/config";
import { MOCK_EVENTS } from "../mock/events";
import { MOCK_VIEWER } from "../mock/viewer";
import { isEligible, isThisWeek, priceFor } from "../model/derive";
import type { EventApi } from "../model/ports";
import type {
  EventDetail,
  EventListQuery,
  EventSummary,
  HomeFeed,
} from "../model/types";

const DEFAULT_LIMIT = 10;
const HOME_CAROUSEL_SIZE = 6;
const HOME_LIST_SIZE = 4;

/**
 * 목 구현 (dev-plan P0-6).
 *
 * 서버가 할 일을 흉내낸다 — 필터·정렬·페이지네이션을 메모리에서 처리한다.
 * 정확도가 목적이 아니라 **화면이 실제 응답 형태를 마주하게 하는 것**이 목적이다.
 * 그래서 인위적 지연을 넣고 커서 페이지네이션도 흉내낸다(스켈레톤·무한 스크롤을
 * 개발 중에 실제로 보기 위해).
 *
 * `eligibleOnly`·`maxPrice`·가격 정렬은 **서버가 인증 주체로 해석하는** 조건이라
 * 쿼리에 성별·출생연도가 실리지 않는다(13장). 그 자리를 `MOCK_VIEWER` 가 대신한다.
 */
export const mockEventApi: EventApi = {
  async getHomeFeed() {
    await delay();

    return {
      // 이번 주 개최 + popularity 내림차순 (5.3)
      weeklyPopular: MOCK_EVENTS.filter((event) => isThisWeek(event.date))
        .sort(byPopularity)
        .slice(0, HOME_CAROUSEL_SIZE),

      // 프로필 출생연도로 걸러 최신순. 게스트 처리는 화면이 세션으로 판단한다
      myAgeGroup: MOCK_EVENTS.filter((event) => isEligible(event, MOCK_VIEWER))
        .sort(byCreatedAtDesc)
        .slice(0, HOME_CAROUSEL_SIZE),

      newlyAdded: [...MOCK_EVENTS].sort(byCreatedAtDesc).slice(0, HOME_LIST_SIZE),

      baseAreaLabel: "성수동",
    } satisfies HomeFeed;
  },

  async getList(query) {
    await delay();

    const filtered = applyFilters(MOCK_EVENTS, query);
    const sorted = applySort(filtered, query.sort);
    return paginateArray(
      sorted,
      query.cursor ?? null,
      query.limit ?? DEFAULT_LIMIT,
    );
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
        message: "요청한 소개팅을 찾을 수 없습니다.",
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

    // 검색 대상: 소개팅명 + 지역 + 주최사 (11.1). 카테고리 축은 삭제됐다.
    return MOCK_EVENTS.filter((event) =>
      [event.title, event.area, event.provider]
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

export function applyFilters(
  events: readonly EventDetail[],
  query: EventListQuery,
): EventSummary[] {
  return events.filter((event) => {
    if (query.district && query.district !== "ALL") {
      if (event.district !== query.district) return false;
    }

    if (query.area && event.area !== query.area) return false;

    if (query.when && query.when !== "ALL") {
      const thisWeek = isThisWeek(event.date);
      if (query.when === "THIS_WEEK" && !thisWeek) return false;
      if (query.when === "LATER" && thisWeek) return false;
    }

    if (query.slot && query.slot !== "ALL" && event.timeSlot !== query.slot) {
      return false;
    }

    if (query.scale && query.scale !== "ALL" && event.scale !== query.scale) {
      return false;
    }

    if (query.status === "OPEN" && event.status !== "신청 가능") return false;

    if (query.mood?.length) {
      // 다중 선택은 OR 조건이다 (6.4)
      const hit = query.mood.some((mood) => event.mood.includes(mood));
      if (!hit) return false;
    }

    if (query.maxPrice !== undefined) {
      const price = priceFor(event, MOCK_VIEWER.gender);
      // 가격 미확인 건은 상한 필터에서 제외한다. "3만원 이하"를 건 사용자에게
      // 가격을 모르는 건을 섞어 내놓으면 필터가 거짓말이 된다.
      if (price === null || price > query.maxPrice) return false;
    }

    if (query.eligibleOnly && !isEligible(event, MOCK_VIEWER)) return false;

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
      // '최신순' 은 등록 시각 기준이다. 개최일 임박순이 아니다 (5.3 '새로 등록된'과 같은 축)
      return sorted.sort(byCreatedAtDesc);
    case "priceAsc":
      return sorted.sort(byPriceAsc);
    case "priceDesc":
      return sorted.sort(byPriceDesc);
    case "popular":
    default:
      return sorted.sort(byPopularity);
  }
}

function byPopularity(a: EventSummary, b: EventSummary): number {
  return b.popularity - a.popularity;
}

function byCreatedAtDesc(a: EventSummary, b: EventSummary): number {
  return b.createdAt.localeCompare(a.createdAt);
}

/**
 * 가격 정렬은 **사용자 성별 기준값**을 쓴다 (6.2).
 * 가격 미확인(`null`) 건은 오름/내림 어느 쪽이든 **항상 뒤로 보낸다** —
 * `가격 낮은순` 첫 줄이 "가격 모름"이면 정렬을 신뢰할 수 없다.
 */
function byPriceAsc(a: EventSummary, b: EventSummary): number {
  const pa = priceFor(a, MOCK_VIEWER.gender);
  const pb = priceFor(b, MOCK_VIEWER.gender);
  if (pa === null || pb === null) return nullsLast(pa, pb);
  return pa - pb;
}

function byPriceDesc(a: EventSummary, b: EventSummary): number {
  const pa = priceFor(a, MOCK_VIEWER.gender);
  const pb = priceFor(b, MOCK_VIEWER.gender);
  if (pa === null || pb === null) return nullsLast(pa, pb);
  return pb - pa;
}

function nullsLast(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0;
  return a === null ? 1 : -1;
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
