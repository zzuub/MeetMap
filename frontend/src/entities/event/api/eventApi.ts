import { ENDPOINTS, fetchClient, type CursorPage } from "@/shared/api";
import { USE_MOCK } from "@/shared/config";
import type {
  EventDetail,
  EventListQuery,
  EventSummary,
  HomeFeed,
} from "../model/types";
import { mockEventApi } from "./eventApi.mock";

/**
 * 행사 조회 인터페이스 (dev-plan P0-6).
 *
 * **화면은 이 인터페이스만 안다.** 목/실 API 분기는 이 파일 마지막 줄 한 곳에서만
 * 일어나고, 백엔드가 뜨면 `NEXT_PUBLIC_USE_MOCK=false` 로 내리는 것으로 끝난다.
 * 컴포넌트 안에 `if (USE_MOCK)` 을 쓰지 않는다.
 */
export interface EventApi {
  /** 홈 3개 섹션 일괄 조회 (5.3) */
  getHomeFeed(params: { lat?: number; lng?: number }): Promise<HomeFeed>;
  /** 탐색 목록. 커서 페이지네이션 (6.1) */
  getList(query: EventListQuery): Promise<CursorPage<EventSummary>>;
  getDetail(id: string): Promise<EventDetail>;
  /** 지도 마커. 뷰포트 bbox 기준 (6.6) */
  getMapMarkers(
    query: EventListQuery & { bbox?: string },
  ): Promise<EventSummary[]>;
  search(keyword: string): Promise<EventSummary[]>;
  /** 아웃링크 클릭 로깅 (7.3). 실패해도 사용자 흐름을 막지 않는다. */
  logOutboundClick(id: string): Promise<void>;
}

const httpEventApi: EventApi = {
  getHomeFeed: ({ lat, lng }) =>
    fetchClient<HomeFeed>(ENDPOINTS.event.home, { query: { lat, lng } }),

  getList: (query) =>
    fetchClient<CursorPage<EventSummary>>(ENDPOINTS.event.list, {
      query: serializeQuery(query),
    }),

  getDetail: (id) => fetchClient<EventDetail>(ENDPOINTS.event.detail(id)),

  getMapMarkers: ({ bbox, ...query }) =>
    fetchClient<EventSummary[]>(ENDPOINTS.event.map, {
      query: { ...serializeQuery(query), bbox },
    }),

  search: (keyword) =>
    fetchClient<EventSummary[]>(ENDPOINTS.event.search, { query: { q: keyword } }),

  logOutboundClick: async (id) => {
    try {
      await fetchClient<void>(ENDPOINTS.event.outboundClick(id), {
        method: "POST",
      });
    } catch {
      // 통계 로깅 실패로 외부 이동을 막지 않는다.
    }
  },
};

/** 배열·불리언을 쿼리스트링 형태로 눌러 담는다 (6.1 URL 설계와 동일 형식). */
function serializeQuery(query: EventListQuery) {
  return {
    province: query.province,
    district: query.district,
    slot: query.slot,
    sort: query.sort,
    mood: query.mood?.length ? query.mood.join(",") : undefined,
    only20s: query.only20s ? "1" : undefined,
    gender: query.gender,
    area: query.area,
    cursor: query.cursor ?? undefined,
    limit: query.limit,
  };
}

export const eventApi: EventApi = USE_MOCK ? mockEventApi : httpEventApi;
