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
     * ⚠️ **이 POST 는 저장만 하는 것이 아니다.** 온보딩의 필수 구간이 여기서
     * 끝나므로 **세션의 `isNewUser` 가 함께 내려가야 한다** (`decisions.md` 4.43).
     * 안 내려가면 실 모드에서 기존 회원이 로그인할 때마다 약관 화면으로 되돌아온다.
     *
     * ⚠️⚠️ **그런데 지금 프론트에는 그 갱신을 받을 자리가 없다** (`decisions.md` 4.50).
     * 이 호출은 Server Action 안에서 나가는 **서버→서버 fetch** 라, 백엔드가
     * `Set-Cookie` 를 정확히 내려도 그 헤더는 Next 서버에서 끝나고 브라우저의
     * `meetmap_at` 은 그대로다 — `fetchClient` 는 `response.headers` 를 읽지 않는다.
     * OAuth 콜백은 브라우저가 직접 리다이렉트를 타므로 이 문제가 없다. **여기만
     * 다르다.**
     *
     * **실 API 전환 시 반드시 함께 정해야 한다** — 둘 중 하나다.
     * ① 응답 `Set-Cookie` 를 액션이 읽어 `cookies().set()` 으로 릴레이한다
     *   (`fetchClient` 에 헤더를 돌려주는 옵션이 필요하다)
     * ② 갱신된 토큰을 **응답 본문**으로 내려주고 액션이 그대로 심는다
     *   (서버 액션 구조에는 이쪽이 단순하다)
     */
    terms: "/users/me/terms",
    profile: "/users/me/profile",
    /**
     * 선호 지역만 갱신 (4.3 활동 지역 선택).
     *
     * **프로필의 `preferredAreas` 와 같은 값이다** — 지역 마스터도 한도도 같아서
     * 값을 둘로 두면 어긋난다 (`decisions.md` 4.53). 그래서 새 필드가 아니라
     * 좁은 쓰기다.
     *
     * 요구사항 셋.
     * 1. `PATCH`, 본문 `{ preferredAreas: string[] }`. 지역 마스터(`AREAS`) 밖의
     *    값과 3개 초과는 **서버도 거른다** — 프론트의 정규화는 방어선일 뿐이다
     * 2. **프로필이 없는 계정에도 받아야 한다.** 위치 권한 화면은 3.3·3.4 로
     *    프로필을 건너뛴 사용자에게도 지역을 묻는다
     * 3. 그럼에도 `GET /users/me/profile` 은 닉네임·성별이 없는 동안 계속
     *    `404`(= 프로필 없음)여야 한다. 지역만 든 반쪽 프로필을 내려주면
     *    화면의 `viewer` 가 근거 없이 살아나 가격 정렬·자격 필터가 열린다 (4.44)
     *
     * ⚠️ **`PUT /users/me/profile` 이 같은 필드를 덮어쓴다.** 프로필 수정 화면
     * (P4-4)을 만들 때 현재 지역을 프리필하지 않으면 여기서 저장한 값이 조용히
     * 사라진다 — 지금 이 값을 읽는 화면이 하나도 없어(4.53) **테스트도 그 회귀를
     * 못 잡는다.** 읽는 화면을 만드는 판이 그 방어선을 함께 세우는 자리다.
     */
    preferredAreas: "/users/me/preferred-areas",
    /**
     * 찜한 소개팅 **id 배열** (9장 · 2.4 `likedIds`).
     *
     * ⚠️ **회차 본문이 아니라 id 만 내려준다.** 홈·탐색은 카드의 찜 표시를 위해 이
     * 값을 읽는데, 회차를 통째로 받으면 같은 데이터를 두 번 나르게 된다. 찜 목록
     * 화면(P2-8)은 본문을 **`event.batch` 로 따로** 받는다 — `?expand=` 를 더하지
     * 않았다 (`decisions.md` 4.62).
     *
     * ⚠️ **`GET /events` 응답의 `isLiked` 와 어긋나면 안 된다.** 화면은 **이 값만**
     * 읽으므로(4.59) 어긋나도 티가 안 나지만, 실 API 는 같은 인증 주체 기준으로
     * 둘을 채워야 한다.
     */
    likes: "/users/me/likes",
    /**
     * 찜 **설정/해제** — `PUT` 이 찜, `DELETE` 가 해제 (7.2).
     *
     * ⚠️ **토글(`POST`)이 아니다.** 낙관적 업데이트가 이미 화면을 그린 뒤에 오므로
     * 토글이면 재시도·중복 클릭이 상태를 뒤집는다. `PUT`/`DELETE` 는 멱등이라 같은
     * 요청이 두 번 가도 답이 같다 (`decisions.md` 4.59).
     */
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
    /**
     * id 로 여러 건 — **`GET /events/batch?ids=a,b,c`** → `EventSummary[]` (9장 찜 목록).
     *
     * 찜 목록은 `user.likes` 로 id 를 받고 이것으로 본문을 받는다. `user.likes?expand=`
     * 로 합치지 않은 이유는 `decisions.md` 4.62 — 요약하면 **`eventApi` 는 쿠키를 못
     * 읽는 모듈이라 "내 찜"을 물을 수 없고**, id 를 인자로 받아야 목·실이 같은 경로를
     * 탄다. `entities/user` 는 `EventSummary` 를 이름조차 부를 수 없다(FSD).
     *
     * 요구사항 넷.
     * 1. **상태로 거르지 않는다.** 마감 회차도 내린다 — 찜한 소개팅은 마감돼도 남는다
     *    (9장). `event.home` 과 정반대라 적어 둔다
     * 2. **없는 id 는 빼고 `200` 이다.** `404` 로 답하면 삭제된 회차 하나가 목록 전체를
     *    에러 카드로 만든다
     * 3. 순서는 약속하지 않아도 된다 — 화면이 개최일로 다시 정렬한다 (4.65)
     * 4. `isLiked` 는 채우지 않아도 된다 — 화면이 읽지 않는다 (4.59)
     *
     * ⚠️ **id 개수 상한이 없다.** 찜 개수에 상한이 없어(9장) 쿼리스트링이 길어질 수
     * 있다. 상한과 넘칠 때의 모양(분할 요청 / `POST` 본문)은 실 API 전환 때 정한다
     * (`spec/14-open-items.md`).
     */
    batch: "/events/batch",
    compare: "/events/compare",
    /**
     * 검색 — **`GET /events/search?q=`** → `EventSummary[]` (11.1).
     *
     * 요구사항 다섯.
     * 1. 대상은 **소개팅명 · 지역(`area`) · 주최사명 각각**의 부분 문자열이고 대소문자를
     *    무시한다. 필드를 이어 붙인 문자열에서 찾지 않는다 — 경계를 넘는 일치가 생긴다
     * 2. `q` 는 **정규화해서 보낸다**(앞뒤 공백 제거 · 연속 공백 한 칸 — `normalizeSearchKeyword`).
     *    서버도 같은 규칙으로 읽는다. 빈 `q` 는 보내지 않는다
     * 3. **상태로 거르지 않는다** — 마감 회차도 내린다. 결과 카드가 상태 배지를 그린다
     * 4. 순서는 약속하지 않아도 된다 — 화면이 다가오는 순으로 정렬한다 (`decisions.md` 4.70)
     * 5. `isLiked` 는 채우지 않아도 된다 — 화면이 읽지 않는다 (4.59)
     *
     * ⚠️ **페이지네이션이 없다.** 결과가 수백 건이면 한 번에 온다. 상한과 모양, 지난 회차를
     * 내릴지는 실 API 전환 때 정한다 (`spec/14-open-items.md`) — 화면은 지난 회차가 섞여 와도
     * 뒤로 보낸다.
     */
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

  /**
   * 검색어 집계 (`entities/search` — `decisions.md` 4.68). 검색 **실행**은 `event.search` 다.
   *
   * **`GET /search/trending`** →
   * `{ baseAt: string, keywords: { keyword: string, previousRank: number | null }[] }`
   *
   * 요구사항 여섯.
   * 1. `keywords` 는 **순위 순서 배열**이다 — 1위가 `[0]`. `rank` 필드를 따로 싣지 않는다.
   *    화면이 위치로 세므로 둘을 주면 어긋날 경로만 생긴다 (4.35 1단)
   * 2. 6개 이하. 화면이 Top 6 로 자른다 (11.1)
   * 3. `previousRank` 는 **직전 스냅샷**의 순위(1부터)이고, 직전 순위표에 없었으면 `null`
   *    이다(화면은 `new`). 스냅샷 간격은 서버가 정한다(가안 1시간) — 화면은 간격을 모른다
   * 4. `baseAt` 은 그 스냅샷의 집계 시각이고 **ISO 8601 + 오프셋**(`Z` 또는 `+09:00`)이다.
   *    화면은 KST `M/D HH:mm 기준` 으로 쓴다
   * 5. **지금 `GET /events/search` 로 1건 이상 나오는 검색어만** 올린다. 누르면 0건인
   *    인기 검색어는 화면이 권한 길이 빈 화면으로 가는 것이다(4.42). 결과 없음 화면의
   *    추천 검색어도 이 목록에서 오므로 **이 보장 하나가 두 자리를 막는다**.
   *    ⚠️ **화면은 이 보장을 막지 않고 관측만 한다.** 스냅샷 뒤에 결과가 사라지면(삭제·숨김)
   *    한 번은 0건으로 떨어진다 — 그 0건 화면이 이 검색어를 인기 검색어에서 찾으면
   *    `console.warn` 을 남긴다(`isTrending`). 백엔드가 지킬 수 있는지는 미확인이다
   *    (`spec/14-open-items.md` · PR 리뷰)
   * 6. 개인정보(이름·연락처)·욕설은 **서버가 걸러서** 올린다 — 사용자가 친 글자를 다른
   *    사용자에게 보여 주는 유일한 자리다
   */
  search: {
    trending: "/search/trending",
  },

  /**
   * 좌표 → 지명 (4.2 위치 확정 안내).
   *
   * **`POST /geo/reverse`**, 본문 `{ lat, lng }` → `{ label: string, area: string | null }`.
   * - `label` 은 화면에 그대로 쓰는 표시용 지명이다 (`서울 성동구 성수동`)
   * - `area` 는 **지역 마스터(`AREAS`) 값이거나 `null`** 이다. 화면이 이 값으로
   *   `/explore?area=…` 를 만들므로 마스터 밖 문자열을 내려주면 조용한 0건이 된다
   *   (`decisions.md` 4.53 / 6.1 `parseArea` 와 같은 이유)
   *
   * ⚠️ **조회인데 `POST` 인 것이 요점이다.** 4.1 이 `위치 정보는 소개팅 추천에만
   * 사용되며 저장되지 않습니다` 를 고정 문구로 못 박았는데, 좌표를 쿼리스트링에
   * 실으면 **프론트가 통제할 수 없는 자리**(게이트웨이·프록시·APM 접근 로그)에
   * 평문으로 남는다. 처음엔 `GET ?lat=&lng=` 로 적고 "백엔드도 로그에 남기지
   * 않아야 한다"를 요구사항으로 달았는데, **지킬 수 없는 쪽에 책임을 넘긴 계약**
   * 이었다 (PR #36 리뷰). 본문으로 보내면 그 자리들이 애초에 안 생긴다.
   *
   * 프론트는 이 호출을 **서버 액션 안에서만** 하고 URL·쿠키 어디에도 남기지
   * 않는다. 백엔드에 남는 요구사항은 하나다 — **본문의 좌표를 저장하지 않는다**
   * (4.54).
   */
  geo: {
    reverse: "/geo/reverse",
  },
} as const;
