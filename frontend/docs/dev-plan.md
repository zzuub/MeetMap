# MeetMap 개발 요구사항 · 진행 순서

> 짝 문서
> - `docs/frontend-feature-spec.md` — 화면·기능 상세 (사양)
> - `docs/progress.md` — **진행 현황과 기술 결정 기록.** 어디까지 되었는지는 그쪽이 원본이다
> - `src/README.md` — FSD 규칙
>
> 이 문서는 **"무엇을 어떤 순서로 만들 것인가"** 만 다룬다. 화면 세부 사양은 기능정의서 장 번호로 참조한다.
> **진행 상태를 여기에 적지 않는다** — 두 군데서 관리하면 반드시 어긋난다. `progress.md` 2장을 본다.
>
> 전제 (기준일 2026-08-31)
> - 백엔드: `backend/meetmap` Spring Boot 스켈레톤 + `testController` 1개. **실 API 없음.**
> - 목업: Onboarding / User v2 / Actions / My / Support / **Admin / Provider / Provider Manage / Admin Manage / Common** 10종. Provider·Admin 목업도 이제 존재하며 User v2와 동일한 컬러 시스템(2.2) 적용 완료. 단 Admin·Provider 화면 상세 기능정의는 아직 `frontend-feature-spec.md`에 문서화되지 않음(USER 한정 문서) — 착수 전 별도 문서 필요.
> - User v2 지도 화면에 지역(시/도→구 2단) 선택 시트, 마커 시각 전용 라벨, 줌 컨트롤 추가 완료(6.3·6.6 참조).

---

## 1. 결론 — 개발 순서

```
Phase 0  공통 기반 (토큰·셸·목 API·인증 스켈레톤)
   ↓
Phase 1  USER 코어 퍼널      홈 → 탐색 리스트 → 상세 → 외부신청 모달
Phase 2  USER 온보딩·개인화   소셜로그인 → 약관 → 프로필 → 위치권한 → 찜 → 검색
Phase 3  USER 지도·비교      탐색 지도뷰 → 마커시트 → 비교함
Phase 4  USER 마이·알림      마이 → 알림함 → 알림설정
Phase 5  USER 후기           후기 목록 → 후기 작성
   ↓
Phase 6  ADMIN 최소 슬라이스  운영자 로그인 → 행사 CRUD → 주최사 승인 → 신고/후기 관리
   ↓
Phase 7  PROVIDER 셀프서비스  가입·심사 → 행사 등록/수정 → 신청 통계
```

### `user → admin → provider` 순서가 맞는가? → **맞다.** 단, 이유를 정확히 알고 가야 한다

| 판단 근거 | 설명 |
| --- | --- |
| 사용자 화면이 제품의 전부 | MeetMap은 **결제를 대행하지 않는 중개 플랫폼**(기능정의서 7.3)이다. 핵심 가치는 "탐색 → 외부 신청 아웃링크"까지이고, 그 뒤는 주최사 사이트에서 끝난다. USER 퍼널이 곧 서비스다. |
| 초기 행사 데이터는 운영자가 넣는다 | 서비스 초기에 주최사가 스스로 등록해줄 이유가 없다. 운영자가 대신 등록·수집하는 게 현실적이고, 그 도구가 ADMIN이다. |
| ADMIN은 PROVIDER의 게이트다 | 주최사 가입에는 **사업자 심사·승인**이 필요하다(3장 참조). 승인 화면(ADMIN)이 없으면 PROVIDER 가입 플로우를 끝까지 만들 수 없다. 즉 ADMIN이 PROVIDER보다 먼저다. |
| 되돌리기 비용 | ADMIN은 내부 사용자 소수 대상이라 UI 재작업 부담이 가장 낮다. 리스크 큰 것(USER)을 먼저, 낮은 것(ADMIN)을 나중에. |

> **다만 Phase 1을 시작하기 전에 Phase 0(권한·인증 모델)을 반드시 먼저 정한다.**
> 인증/역할 모델은 세 앱이 공유하는 뼈대라, USER를 다 만든 뒤에 얹으면 온보딩·미들웨어·API 클라이언트를 전부 다시 손대야 한다.

> **비즈니스 확장 메모 (2026-08-31).** "결제를 대행하지 않는 중개 플랫폼"은 MVP1 한정 전제다. 서비스가 서울 외 지역(경기·대전·전라도 등)으로 확장되는 시점에 결제를 MeetMap이 직접 처리하는 방향으로 전환할 계획이 있으며, 이때는 별도 `payment-service`(MSA)로 분리할 예정이다. 지금 단계에서 코드를 미리 만들 필요는 없지만, 7.3(외부 신청 이동 모달)과 13장 API 설계를 "결제 주체가 나중에 바뀔 수 있다"는 전제로 느슨하게 설계해두는 것을 권장한다.

### 데이터 공급 주체가 바뀌면 순서도 바뀐다

만약 "런칭 시점에 제휴 주최사가 이미 확보되어 직접 등록한다"가 전제라면 `USER → PROVIDER → ADMIN` 이 맞다.
**어느 쪽인지 먼저 확정할 것.** (4장 blocking 항목)

---

## 2. Phase별 요구사항

각 항목의 **완료 조건(DoD)** 을 만족해야 다음 Phase로 넘어간다.

### Phase 0 — 공통 기반

| ID | 작업 | 산출물 | 완료 조건 |
| --- | --- | --- | --- |
| P0-1 | 디자인 토큰 정의 | `src/app/globals.css` `@theme` + `shared/config/theme.ts` | 기능정의서 2.2 토큰(보태니컬 화이트 방향, hex 기준) 전부 CSS 변수로 존재. 컴포넌트에 색상 하드코딩 0건. `--color-accent` 위 흰 텍스트 사용 금지 규칙 포함 |
| P0-2 | 라우트 그룹 셸 | `app/(onboarding)/` `app/(main)/layout.tsx` `app/(stack)/layout.tsx` | 3개 그룹 레이아웃 생성, `(main)`에 BottomNav·`(stack)`에 AppHeader 고정 |
| P0-3 | shared/ui 1차 세트 | `shared/ui/` | `PrimaryButton, Chip, SegmentedControl, Sheet, Modal, Toast, Numeric, Skeleton, EmptyState, ErrorState` |
| P0-4 | 공통 피드백 패턴 | `shared/ui/Toast.tsx`, `Sheet.tsx`, `Modal.tsx` | 2.5 규격(1.8초 소멸, 딤 클릭 닫힘, 포커스 트랩, Esc) 충족 |
| P0-5 | fetch 클라이언트 | `shared/api/fetchClient.ts` | baseURL·인증 헤더·에러 정규화(오류코드 + 발생시각, 11.2 근거) |
| P0-6 | **목 데이터 레이어** | `entities/*/mock/`, `NEXT_PUBLIC_USE_MOCK` | 백엔드 없이 전 화면 동작. 실 API 전환 시 `*Api.ts` 구현체만 교체 |
| P0-7 | **인증·역할 모델 확정** | `middleware.ts`, `entities/account/` | 3장 설계 확정 및 라우트 가드 동작 |
| P0-8 | 데이터 타입 확정 | `entities/{event,user,notification,review}/model/types.ts` | 기능정의서 12장 그대로 이식 |

> P0-6이 이 프로젝트의 속도를 가른다. 백엔드가 비어 있으므로 **API 인터페이스를 먼저 고정하고 목으로 개발**해야 프론트가 백엔드를 기다리지 않는다. 기능정의서 13장 API 목록이 그 계약서다.

---

### Phase 1 — USER 코어 퍼널 (기능정의서 P0)

| ID | 작업 | 참조 | 완료 조건 |
| --- | --- | --- | --- |
| P1-1 | `EventCard` 5개 variant | 14.1 | `feature / ratio / compact / list / sheet` 한 컴포넌트 prop 분기 |
| P1-2 | 상태·시간대 배지, 성비 게이지, 가격 텍스트 | 12장 | `entities/event/ui/` |
| P1-3 | 홈 `/` | 5장 | 헤더 + 헤드라인 + 지도 프로모 + 퀵칩 + 3개 섹션 렌더 |
| P1-4 | 탐색 리스트 `/explore?view=list` | 6.1·6.2·6.5 | **필터 상태 전부 URL 쿼리스트링 동기화**. 새로고침·뒤로가기 유지 |
| P1-5 | 필터 시트 | 6.4 | 칩 선택 즉시 결과 수 실시간 반영, 적용 버튼 없음 |
| P1-5b | **지역(구) 선택 시트** | 6.3 | 시/도(서울만 활성) → 구 2단 계층. 필터 시트와 별개 진입점, URL `province`/`district` 동기화 |
| P1-6 | 정렬 / 뷰 토글 | 6.2 | 4종 정렬 동작 |
| P1-7 | 행사 상세 `/events/[id]` | 7.1·7.2 | 히어로 + 정보카드 + 하단 고정 CTA 3종 |
| P1-8 | **외부 신청 이동 모달** | 7.3 | 법적 고지 문구·조건 확인 블록·하단 경고 **전부 노출**, 새 탭 + `rel="noopener noreferrer"`, 아웃링크 로깅 |
| P1-9 | 빈 상태 / 에러 / 로딩 | 11.2·11.3 | 라우트 그룹별 `error.tsx` `loading.tsx` `not-found.tsx` 배치 |

> **P1-8은 타협 불가.** 결제 비대행 고지가 빠지면 법적 리스크다. 모달을 우회하는 진입 경로(마커 시트의 `신청 페이지로 이동` 포함)를 만들지 않는다.

**Phase 1 DoD** — 로그인 없이 홈 → 탐색 → 상세 → 외부 이동까지 목 데이터로 끊김 없이 진행된다.

---

### Phase 2 — USER 온보딩 · 개인화 (P1)

| ID | 작업 | 참조 | 완료 조건 |
| --- | --- | --- | --- |
| P2-1 | 소셜 로그인 3종 | 3.1 | 카카오/네이버/구글 OAuth. 응답 `isNewUser`로 분기 |
| P2-2 | 약관 동의 | 3.2 | 필수 3 + 선택 1, 전체 동의 토글, 비활성 버튼 라벨이 사유 안내 |
| P2-3 | 인트로 | 3.3 | `1분 만에 설정` / `나중에 할래요` 분기 |
| P2-4 | 프로필 설정 | 3.4 | 닉네임 12자·출생연도·성별·카테고리 5개·지역 3개 한도. **한도 초과 시 토스트**(16장 개선안 반영) |
| P2-5 | 온보딩 완료 | 3.5 | 선택값 기반 동적 문구 |
| P2-6 | 위치 권한 3상태 | 4장 | `asking / granted / denied` 및 거부 시 거리순 정렬·지도 센터링 비활성 |
| P2-7 | 찜 | 7.2·9장 | `useOptimistic` 낙관적 업데이트, 카드 클릭과 `stopPropagation` 분리 |
| P2-8 | 찜 목록 `/likes` | 9장 | 목록 + 빈 상태 |
| P2-9 | 검색 `/search` | 11.1 | `idle / results / empty` 3상태, debounce 300ms, 최근검색어 localStorage, 키워드 하이라이트 |

**Phase 2 DoD** — 신규 가입자가 소셜 로그인부터 홈 진입까지 완주하고, 찜이 서버에 남는다.

---

### Phase 3 — USER 지도 · 비교 (P2)

| ID | 작업 | 참조 | 완료 조건 |
| --- | --- | --- | --- |
| P3-1 | 지도 SDK 연동 + 줌 컨트롤 | 6.6·6.7 | 카카오맵 권장. `next/dynamic(ssr:false)`, `features/event-map/`. 커스텀 `+/−` 줌 버튼, 한계 도달 시 비활성 |
| P3-2 | 마커 + 마커 시트 | 6.6 | 마커 라벨은 시각만 표시(행사명 제거). 필터·지역 결과와 마커 소스 동일. 시트의 이동 버튼은 **P1-8 모달 경유** |
| P3-3 | 비교함 | 8장 | 최대 3개, localStorage 영속, 우위 하이라이트·배지(가성비 > 가까움 > 후기) |
| P3-4 | 비교 플로팅 바 | 7.2 | 1건 이상 담김 시 하단 CTA 위 82px 노출 |

---

### Phase 4 — USER 마이 · 알림 (P3)

| ID | 작업 | 참조 | 완료 조건 |
| --- | --- | --- | --- |
| P4-1 | 마이페이지 | 10.1 | 프로필 카드 + 완성도 + 카운터 3종 + 메뉴 2그룹 |
| P4-2 | 알림함 | 10.2 | 전체/안읽음 필터, 모두 읽음, kind별 딥링크 |
| P4-3 | 알림 설정 | 10.3 | 토글 즉시 저장, 실패 시 롤백 + 토스트 |
| P4-4 | 미제공 화면 신규 설계 | 16장 | 프로필 수정 / 신청 이력 / 약관 상세 / 로그아웃 다이얼로그 |

---

### Phase 5 — USER 후기 (P4)

| ID | 작업 | 참조 | 완료 조건 |
| --- | --- | --- | --- |
| P5-1 | 라우트 분리 확정 | 10.4 | `/events/[id]/reviews` vs `/my/reviews` |
| P5-2 | 평점 요약 · 분포 막대 · 인기 태그 | 10.4 | |
| P5-3 | 후기 작성 | 10.5 | 별점 필수 + 본문 10~500자, **참여 인증 완료 건만 진입** |

> **선행 조건: 참여 인증(participation verification) 정책·API.** 미확정이면 Phase 5는 착수하지 않는다.

---

### Phase 6 — ADMIN 최소 슬라이스

목업 없음 → **화면 설계부터 필요.** USER 목업의 디자인 토큰을 재사용하되 데스크톱 레이아웃으로 새로 잡는다.

| ID | 작업 | 완료 조건 |
| --- | --- | --- |
| P6-1 | 운영자 로그인 | **소셜 로그인 아님.** ID/PW + 2FA, 초대 기반 계정 생성 (3.4) |
| P6-2 | 행사 CRUD | 운영자가 직접 행사 등록·수정·상태 변경. `externalApplyUrl` 필수 |
| P6-3 | 주최사(Provider) 심사·승인 | `PENDING → APPROVED / REJECTED`. Phase 7의 선행 조건 |
| P6-4 | 회원 관리 | 조회·정지·탈퇴 처리 |
| P6-5 | 후기 신고 처리 | 10.5 정책 고지(비방·개인정보 노출 삭제)의 실행 도구 |
| P6-6 | 아웃링크 통계 | 13장 `outbound-click` 로그 집계. 정산 근거 |

---

### Phase 7 — PROVIDER 셀프서비스

| ID | 작업 | 완료 조건 |
| --- | --- | --- |
| P7-1 | 주최사 가입 | 소셜 인증 + **사업자 정보 심사 폼**, 승인 대기 상태 화면 (3.3) |
| P7-2 | 행사 등록/수정 | P6-2와 동일 스키마. 등록 시 검수 대기 상태 진입 여부 결정 필요 |
| P7-3 | 내 행사 대시보드 | 노출수·아웃링크 클릭수·찜수 |
| P7-4 | 후기 열람 / 답글 | 답글 기능 제공 여부 미정 |

---

## 3. 권한(Role) 설계 — 가입 분기

### 3.1 핵심 원칙: 소셜 로그인은 "신원"만 준다. "권한"은 우리 서버가 부여한다

카카오·네이버·구글은 MeetMap의 USER / PROVIDER / ADMIN 개념을 모른다. OAuth가 돌려주는 건 *이 사람이 누구인가*(providerId, email)뿐이다.
따라서 "소셜 회원가입하면 권한별로 가입이 가능한가?"의 답은:

> **가능하다. 단 권한은 소셜에서 오는 게 아니라, "어느 진입점으로 들어왔는가"를 서버가 기록해서 부여하는 것이다.**

### 3.2 모델: 계정과 역할을 분리한다

```ts
// entities/account/model/types.ts
export type Role = 'USER' | 'PROVIDER' | 'ADMIN';
export type MembershipStatus = 'ACTIVE' | 'PENDING' | 'REJECTED' | 'SUSPENDED';

export interface Account {          // 인증 주체 (소셜 신원과 1:1)
  id: string;
  authProvider: 'KAKAO' | 'NAVER' | 'GOOGLE' | 'LOCAL';
  authProviderId: string;
  email: string | null;
}

export interface Membership {       // 역할 부여 (Account 1:N)
  accountId: string;
  role: Role;
  status: MembershipStatus;
  grantedAt: string;
}
```

**왜 1:N인가** — 같은 사람이 개인 회원이면서 주최사 담당자일 수 있다. 계정 하나에 `role` 컬럼 하나로 박아두면 "이 사람 주최사도 하고 싶대요"에서 계정을 새로 파야 한다. 테이블 하나 더 두는 비용이 훨씬 싸다.
단 **UI에서는 한 번에 하나의 역할만 활성**시킨다(역할 전환 메뉴). 동시 표시는 복잡도만 늘린다.

### 3.3 가입 분기 — 진입점을 나눈다

| 역할 | 진입 경로 | 가입 방식 | 결과 상태 |
| --- | --- | --- | --- |
| **USER** | `/onboarding` | 소셜 3종. 약관 → 프로필 | 즉시 `ACTIVE` |
| **PROVIDER** | `/provider/signup` | 소셜 인증 **+ 사업자 정보 폼**(사업자등록번호, 상호, 담당자, 정산 계좌) | `PENDING` → 운영자 승인 후 `ACTIVE` |
| **ADMIN** | 가입 화면 **없음** | 기존 운영자의 초대 또는 시드 계정 | 내부 발급만 |

**OAuth에 역할 의도를 실어 보내는 방법** — `state` 파라미터를 쓴다.

```
1. /provider/signup 에서 로그인 클릭
2. 서버가 state = sign({ intent: 'PROVIDER', nonce, exp }) 생성  ← 서명 필수
3. 소셜 인증 → 콜백에 state 그대로 돌아옴
4. 서버가 state 서명 검증 → intent에 따라 Membership 생성
   - USER      → ACTIVE
   - PROVIDER  → PENDING (심사 대기)
```

> **콜백 요청 바디의 `role` 값을 그대로 믿으면 안 된다.** 클라이언트가 `role: 'ADMIN'` 을 보내는 순간 권한 상승 취약점이 된다.
> 역할 의도는 반드시 **서버가 서명한 state**로만 전달하고, `ADMIN`은 애초에 intent 허용 목록에서 제외한다.

### 3.4 ADMIN은 소셜 로그인을 쓰지 않는다

이유는 세 가지다.

1. 카카오 계정 하나가 털리면 운영자 권한이 통째로 넘어간다.
2. 퇴사자 계정 회수를 우리가 통제할 수 없다(소셜 계정은 개인 소유).
3. 2FA·세션 정책·IP 제한 같은 내부 통제를 소셜 위에 얹기 어렵다.

→ ADMIN은 `LOCAL`(ID/PW + 2FA), 초대 발급, 별도 서브도메인 또는 별도 Next 앱으로 분리한다.

### 3.5 라우트 가드

```
// middleware.ts — 경로 프리픽스 기반
/onboarding, /, /explore, /events, /search   → 비로그인 허용 (게스트 탐색)
/likes, /compare, /my, /reviews/write        → USER 필요
/provider/**                                 → PROVIDER + status ACTIVE
/provider/pending                            → PROVIDER + status PENDING (심사 대기 안내)
/admin/**                                    → ADMIN
```

- 역할은 **JWT 클레임(`role`, `status`)** 에 담고 미들웨어에서 프리픽스로 판정한다.
- 클라이언트 판정은 UX용일 뿐이다. **API 서버가 매 요청 권한을 재검증**한다.
- 게스트가 `/likes` 접근 → `/onboarding?redirect=/likes` 로 보낸 뒤 로그인 후 복귀.

> 게스트 허용 범위는 기능정의서 16장 미결 항목이다. 위 표는 **탐색은 열고 개인화 기능은 로그인**을 전제로 한 제안이며, Phase 0에서 확정해야 한다.

---

## 4. 착수 전 반드시 확정할 것 (blocking)

정해지지 않으면 해당 Phase는 시작하지 않는다. 나중에 갈아엎는 비용이 크다.

| 순위 | 항목 | 막는 Phase | 기본안 |
| --- | --- | --- | --- |
| 1 | **역할 모델 · 게스트 허용 범위** (3장) | Phase 0 전체 | Account/Membership 분리, 탐색은 게스트 허용 |
| 2 | **초기 행사 데이터 공급 주체** (운영자 vs 주최사) | Phase 6/7 순서 | 운영자 → `USER → ADMIN → PROVIDER` |
| 3 | **지역 마스터 통일** (온보딩 6개 vs 위치권한 8개, 둘 다 "동" 단위) + 지도 화면의 "구" 단위 지역 필터(6.3, 신규)와의 관계 정리 | Phase 1 / Phase 3 | 동 단위 8개로 통일 + 구 단위는 별도 마스터(서울 25개 구 중 행사 있는 구만) 유지 |
| 4 | **`genderPolicy` 필드 정의** — 현재 목업은 `무관` 외 선택 시 결과 0건 | Phase 1 (필터) | `ANY / BALANCED / MALE_ONLY / FEMALE_ONLY` |
| 5 | 지도 SDK 선정 + 클러스터링 정책 | Phase 3 | 카카오맵 (국내 POI 정확도) |
| 6 | 서버 상태 라이브러리 (TanStack Query 도입 여부) | Phase 0 | 도입 권장 — 찜 낙관적 업데이트·무한 스크롤 직접 구현 비용이 크다 |
| 7 | 페이지네이션 방식 | Phase 1 | 커서 + 무한 스크롤 |
| 8 | `마감` 상태 행사의 신청 버튼 처리 | Phase 1 | 비활성 + 사유 라벨 |
| 9 | 참여 인증 정책 · API | Phase 5 | — |
| 10 | 인기순(`popularity`) 산식, "여성 신청 많은" 집계 기준 | Phase 1 (서버) | 서버 산출값 사용, 프론트는 정렬만 |

나머지 미결 항목은 기능정의서 16장 참조. 위 10개 외에는 **기본값으로 진행하고 나중에 바꾼다**.

---

## 5. 작업 규칙

1. **레이어 방향 준수** — `app → widgets → features → entities → shared`. 역방향·동일 레이어 참조 금지 (`src/README.md`).
2. **한 화면 전용 컴포넌트는 올리지 않는다** — 라우트 옆 `_components/`에 둔다.
3. **폴더는 `index.ts`로만 공개** — 내부 파일 직접 import 금지.
4. **URL이 상태의 원본** — 탐색 필터·정렬·뷰는 쿼리스트링. `useState`로 들고 있지 않는다 (2.4).
5. **비활성 버튼의 라벨이 사유를 말한다** — 별도 에러 토스트를 띄우지 않는다 (2.5). 이 제품의 일관된 패턴이다.
6. **숫자(가격·평점·카운터)는 세리프** — `shared/ui/Numeric.tsx`로 강제 (2.2).
7. **Next.js 16 문법 확인** — 학습 데이터와 다르다. 작성 전 `node_modules/next/dist/docs/` 확인 (`AGENTS.md`).
8. **접근성은 만들 때 넣는다** — `div + onClick` 금지, 터치 타깃 44×44, 시트·모달 포커스 트랩 (15장). 나중에 넣으면 전면 수정이 된다.
