> 기능정의서 · 13장 API 목록 (프론트 관점)
> 상위 [00-index.md](00-index.md) · 공통 전제 [02-공통규칙.md](02-공통규칙.md) · 타입 [10-데이터모델.md](10-데이터모델.md)

---

## 13. API 목록 (프론트 관점)

> 백엔드 MSA 서비스 경계와 1:1 대응. 실제 스펙 확정 후 갱신.

| 화면 | 메서드 | 엔드포인트(가안) | 비고 |
| --- | --- | --- | --- |
| 로그인 | `POST` | `/auth/oauth/{provider}` | 응답에 `isNewUser` |
| 약관 | `POST` | `/users/me/terms` | |
| 프로필 설정 | `PUT` | `/users/me/profile` | |
| 홈 | `GET` | `/events/home?lat&lng` | 3개 섹션 일괄 조회. **세 섹션 모두 모집 중(`신청 가능`)만 내려준다** — 홈에는 상태 필터가 없어 마감 건을 걷어낼 수단이 없다 (5.3) |
| 탐색 목록 | `GET` | `/events?when&slot&scale&status&maxPrice&eligibleOnly&sort&mood&area&district&cursor` | 커서 페이지네이션. `maxPrice`·`eligibleOnly`는 서버가 인증 주체의 성별·출생연도로 해석한다. `sort=rating`은 주최사 `ratingScore` 기준(6.2) |
| 지도 마커 | `GET` | `/events/map?bbox&{필터}` | 뷰포트 기준 |
| 소개팅 상세 | `GET` | `/events/{id}` | 응답의 `provider`가 `ProviderSummary`(평점 포함) |
| **주최사 소개** | `GET` | `/providers/{id}` | 프로필 + 모집 중인 회차 + 최근 후기 3건 + 평점 요약 (7.4) |
| **주최사 후기 목록** | `GET` | `/providers/{id}/reviews?category&cursor` | 그 주최사의 전 회차 후기. 커서 페이지네이션 |
| 찜 등록/해제 | `POST` / `DELETE` | `/users/me/likes/{eventId}` | |
| 찜 목록 | `GET` | `/users/me/likes` | |
| 비교 | `GET` | `/events/compare?ids=1,2,3` | 클라이언트 조합도 가능 |
| 검색 | `GET` | `/events/search?q` | |
| 인기 검색어 | `GET` | `/search/trending` | 기준 시각 포함 |
| 알림 목록 | `GET` | `/users/me/notifications?unreadOnly` | |
| 알림 읽음 | `PATCH` | `/users/me/notifications/{id}/read`, `/read-all` | |
| 알림 설정 | `GET` / `PUT` | `/users/me/notification-settings` | |
| 내가 쓴 후기 | `GET` | `/users/me/reviews?category` | 평점 요약 블록 없음 (10.4) |
| 후기 작성 | `POST` | `/events/{id}/reviews` | 참여 인증 검증. 서버가 회차의 `providerId`를 붙여 저장한다 |
| 아웃링크 로깅 | `POST` | `/events/{id}/outbound-click` | 정산·통계용 |
