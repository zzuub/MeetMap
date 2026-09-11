import type { CursorPage } from "@/shared/api";
import type {
  EventDetail,
  EventListQuery,
  EventSummary,
  HomeFeed,
} from "./types";

/**
 * 소개팅 조회 계약 (port).
 *
 * **화면은 이 인터페이스만 안다.** 목/실 API 구현은 `api/` 에 있고, 분기는
 * `api/eventApi.ts` 마지막 한 줄에서만 일어난다. 컴포넌트 안에 `if (USE_MOCK)`
 * 을 쓰지 않는다.
 *
 * 계약이 `model/` 에 있고 구현이 `api/` 에 있는 이유: 구현이 계약을 import 하는
 * 단방향이 되어야 한다. 계약을 `api/eventApi.ts` 에 두면 구현(`eventApi.mock.ts`)이
 * 그 파일을 다시 import 하게 되어 서로가 서로를 가리키는 모양이 된다.
 * (`import type` 이라 런타임 순환은 아니지만 읽는 사람이 매번 확인해야 한다.)
 */
export interface EventApi {
  /**
   * 홈 3개 섹션 일괄 조회 (5.3).
   *
   * **세 섹션 모두 모집 중만 돌려준다.** 홈에는 상태 필터가 없어 마감 건을 걷어낼
   * 수단이 없다 (`decisions.md` 4.23). 이 필터링은 **서버의 책임**이며, 클라이언트는
   * 계약이 깨진 경우를 대비해 한 번 더 거른다(`api/eventApi.ts` 의 `openSectionsOnly`).
   */
  getHomeFeed(params: { lat?: number; lng?: number }): Promise<HomeFeed>;
  /** 탐색 목록. 커서 페이지네이션 (6.1) */
  getList(query: EventListQuery): Promise<CursorPage<EventSummary>>;
  getDetail(id: string): Promise<EventDetail>;
  /**
   * id 로 여러 건 (9장 찜 목록). **어떤 id 를 물을지는 호출부가 정한다** — 이 포트는
   * 클라이언트에서도 도는 모듈이라 "내 찜"을 모른다 (`decisions.md` 4.59·4.62).
   *
   * - **상태로 거르지 않는다.** 찜한 소개팅은 마감돼도 남는다 — `getHomeFeed` 와 반대다
   * - **없는 id 는 에러 없이 빠진다.** 삭제된 회차 하나가 목록 전체를 에러로 만들지 않게
   * - **순서를 약속하지 않는다.** 정렬은 화면이 한다
   */
  getByIds(ids: readonly string[]): Promise<EventSummary[]>;
  /** 지도 마커. 뷰포트 bbox 기준 (6.6) */
  getMapMarkers(
    query: EventListQuery & { bbox?: string },
  ): Promise<EventSummary[]>;
  search(keyword: string): Promise<EventSummary[]>;
  /** 아웃링크 클릭 로깅 (7.3). 실패해도 사용자 흐름을 막지 않는다. */
  logOutboundClick(id: string): Promise<void>;
}
