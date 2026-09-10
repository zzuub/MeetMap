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
    /**
     * 약관 동의 (3.2).
     *
     * ⚠️ **이 POST 는 저장만 하는 것이 아니다.** 응답에서 **갱신된 세션 토큰을
     * `Set-Cookie` 로 심어 `isNewUser` 를 내려야 한다** — 온보딩의 필수 구간이
     * 여기서 끝나기 때문이다 (`decisions.md` 4.43).
     *
     * 안 지키면 실 모드에서 **`isNewUser` 가 영원히 참**으로 남아 기존 회원이
     * 로그인할 때마다 약관 화면으로 되돌아온다. 프론트에는 이 계약을 확인할 수단이
     * 없다 — 목 모드에는 재현 경로가 없어 `accountApi.finishSignUp` 의 http 구현이
     * 비어 있고, 테스트도 이 실패를 잡지 못한다 (PR #35 리뷰).
     */
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

  /**
   * 주최사 (7.4).
   *
   * 후기 목록이 `event` 가 아니라 여기 있는 것이 2026-09-02 재정의의 요점이다 —
   * 후기는 회차에 대해 쓰지만(`event.reviews` 가 POST 대상) **주최사에 쌓인다.**
   * 회차별 후기 목록 조회는 만들지 않는다.
   */
  provider: {
    detail: (id: string) => `/providers/${id}`,
    reviews: (id: string) => `/providers/${id}/reviews`,
  },

  search: {
    trending: "/search/trending",
  },
} as const;
