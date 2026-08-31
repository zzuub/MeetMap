/**
 * 백엔드 엔드포인트 목록 (기능정의서 13장).
 *
 * 백엔드가 아직 비어 있으므로 이 파일이 **프론트-백 계약서** 역할을 한다.
 * 실제 스펙이 확정되면 여기만 고치고, 화면 코드는 건드리지 않는다.
 *
 * 결제 관련 메모(6.3 / dev-plan 1장): MVP1은 신청·결제를 주최사 외부 페이지에
 * 100% 위임하지만, 서울 외 확장 시 MeetMap 자체 결제(별도 `payment-service`)로
 * 전환할 계획이 있다. 그래서 `outboundClick` 은 "외부로 보냈다"는 사실을 남기는
 * 독립 엔드포인트로 유지한다 — 나중에 내부 결제로 바뀌어도 이 경로만 갈아끼우면 된다.
 */
export const ENDPOINTS = {
  auth: {
    /** 응답에 `isNewUser` 포함 (3.1) */
    oauth: (provider: string) => `/auth/oauth/${provider}`,
    session: "/auth/session",
    logout: "/auth/logout",
  },

  user: {
    terms: "/users/me/terms",
    profile: "/users/me/profile",
    likes: "/users/me/likes",
    like: (eventId: string) => `/users/me/likes/${eventId}`,
    notifications: "/users/me/notifications",
    notificationRead: (id: string) => `/users/me/notifications/${id}/read`,
    notificationReadAll: "/users/me/notifications/read-all",
    notificationSettings: "/users/me/notification-settings",
    reviews: "/users/me/reviews",
  },

  event: {
    /** 3개 섹션 일괄 조회 (5.3) */
    home: "/events/home",
    list: "/events",
    /** 뷰포트 bbox 기준 마커 (6.6) */
    map: "/events/map",
    detail: (id: string) => `/events/${id}`,
    compare: "/events/compare",
    search: "/events/search",
    reviews: (id: string) => `/events/${id}/reviews`,
    /** 정산·통계용 아웃링크 로깅 (7.3) */
    outboundClick: (id: string) => `/events/${id}/outbound-click`,
  },

  search: {
    trending: "/search/trending",
  },
} as const;
