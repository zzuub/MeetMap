import { ENDPOINTS, fetchClient, type CursorPage } from "@/shared/api";
import { USE_MOCK } from "@/shared/config";
import { isOpen } from "../model/derive";
import type { EventApi } from "../model/ports";
import {
  HOME_SECTION_KEYS,
  type EventDetail,
  type EventListQuery,
  type EventSummary,
  type HomeFeed,
} from "../model/types";
import { mockEventApi } from "./eventApi.mock";

/**
 * 실 API 구현과 목 구현의 분기 지점 (dev-plan P0-6).
 *
 * 계약은 `model/ports.ts` 의 `EventApi` 에 있다. 백엔드가 뜨면
 * `NEXT_PUBLIC_USE_MOCK=false` 로 내리는 것으로 전환이 끝난다.
 */
const httpEventApi: EventApi = {
  getHomeFeed: async ({ lat, lng }) =>
    openSectionsOnly(
      await fetchClient<HomeFeed>(ENDPOINTS.event.home, { query: { lat, lng } }),
    ),

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
 * 홈 세 섹션에서 마감 건을 걷어낸다.
 *
 * **거르는 것은 서버의 책임이다**(`ports.ts` 계약). 여기서 한 번 더 거르는 것은
 * 방어선이다 — 홈에는 상태 필터도 상태 배지도 없어서(4.23) 계약이 깨지면 사용자가
 * 알아챌 방법이 없다. 잘못 보여주는 것보다 덜 보여주는 쪽을 고른다.
 *
 * 목 구현은 이 함수를 쓰지 않는다. 거기서는 **자르기 전에** 걸러야 섹션이 6건을
 * 채운다 — 서버가 해야 할 일과 같다.
 */
export function openSectionsOnly(feed: HomeFeed): HomeFeed {
  const filtered = { ...feed };
  for (const key of HOME_SECTION_KEYS) filtered[key] = filtered[key].filter(isOpen);
  return filtered;
}

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
