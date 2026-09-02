import { ENDPOINTS, fetchClient, type CursorPage } from "@/shared/api";
import { USE_MOCK } from "@/shared/config";
import type { EventApi } from "../model/ports";
import type {
  EventDetail,
  EventListQuery,
  EventSummary,
  HomeFeed,
} from "../model/types";
import { mockEventApi } from "./eventApi.mock";

/**
 * 실 API 구현과 목 구현의 분기 지점 (dev-plan P0-6).
 *
 * 계약은 `model/ports.ts` 의 `EventApi` 에 있다. 백엔드가 뜨면
 * `NEXT_PUBLIC_USE_MOCK=false` 로 내리는 것으로 전환이 끝난다.
 */
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

/**
 * 배열·불리언을 쿼리스트링 형태로 눌러 담는다 (6.1 URL 설계와 동일 형식).
 *
 * `maxPrice`·`eligibleOnly` 에는 성별·출생연도를 싣지 않는다 —
 * **서버가 인증 주체로 해석한다** (13장). 클라이언트가 프로필 값을 실어 보내면
 * 자기 조건을 위조할 수 있는 축이 생긴다.
 */
function serializeQuery(query: EventListQuery) {
  return {
    province: query.province,
    district: query.district,
    when: query.when,
    slot: query.slot,
    scale: query.scale,
    status: query.status,
    maxPrice: query.maxPrice,
    eligibleOnly: query.eligibleOnly ? "1" : undefined,
    sort: query.sort,
    mood: query.mood?.length ? query.mood.join(",") : undefined,
    area: query.area,
    cursor: query.cursor ?? undefined,
    limit: query.limit,
  };
}

export const eventApi: EventApi = USE_MOCK ? mockEventApi : httpEventApi;
