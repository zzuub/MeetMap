# 세션 인수인계 — Claude 전용

> **이 문서의 용도**: 새 Claude Code 세션이 **맨 먼저 한 번 읽는** 온보딩 문서다.
> 코드베이스를 다시 탐색하지 않고 바로 작업에 들어가기 위한 것이다.
> 사람용 문서가 아니므로 간결함이 우선이다. 세부는 아래 문서를 가리킨다.
>
> **읽는 순서**: 이 문서 → `progress.md` 2·4·5장 → 착수할 Phase 의 `dev-plan.md` 항목 → 해당 `frontend-feature-spec.md` 장
>
> 마지막 갱신: 2026-09-02 (P1-0 완료, P1-1 착수 직전)

---

## 0. ⚠️ 먼저 읽을 것 — 2026-09-01 도메인 재정의

제품 정의가 좁혀졌다.

MeetMap 은 **인스타그램에 개인 단위로 흩어진 로테이션 소개팅을 한곳에 모아 비교·탐색하게 해주는 통합 플랫폼**이다. 소개팅을 직접 주최하지 않는다. 지도·필터·요약 카드·상세·비교함까지의 탐색 경험은 MeetMap 이 제공하고, **신청과 결제는 주최사의 기존 폼으로 리다이렉트**한다. 일반 모임은 코어가 아니라 추후 확장 옵션이다.

성장 단계는 ① 운영자가 주최사에 컨택·양해를 구하고 **대신 등록** → ② 주최사 셀프서비스 등록 → ③ 결제 내재화(별도 `payment-service`) 순이며, **현재는 ①** 이다.

### 문서·목업·코드가 모두 새 기준이다

PR #8(`e2e87c4`)로 **기능정의서·개발계획·용어**가, 이슈 #9(`0fa3efb`)의 **P1-0** 으로 **타입·상수·목데이터·목 API** 가 새 기준이 됐다.

**남은 것은 화면과 목업이다.** 목업 10종은 Claude Design 에서 갱신됐으나 일부에 옛 값(카테고리·잔여석·성비 게이지·단일 가격)이 남아 있을 수 있다 — **어긋나 보이면 기능정의서가 원본이다.**

실제 주최사 운영 방식을 조사한 결과 목업이 전제한 값 중 **도메인에 존재하지 않는 것**들이 드러났다.

| 필드 | 조치 | 이유 |
| --- | --- | --- |
| `category` | **삭제** | 상품 종류가 로테이션 소개팅 하나다. 취미 카테고리(와인/전시/러닝)는 성립하지 않고 게시물에서 추출도 안 된다 |
| `remainingSeats` | **삭제**, `EventStatus` 3→2 (`신청 가능`/`마감`) | 선착순이 아니라 **주최사가 지원자를 심사해 선발**한다. 마감 선언 전까지 계속 받으므로 잔여 좌석이라는 값이 없다 |
| `femaleRatio` | **삭제** → `maleCapacity`/`femaleCapacity` | 정원이 남녀 고정(7:7, 15:15)이라 성비는 항상 50% |
| `minAge`/`maxAge` | → `birthYearFrom`/`birthYearTo` | 주최사는 나이가 아니라 **출생연도**로 모집한다 (`90~96년생`) |
| `price` | → `malePrice`/`femalePrice` (nullable) | 남녀 가격이 다르다. 신청 폼 안에만 있어 등록 시 확보 못 하는 건이 있다 |
| `applyDeadline` | **삭제** + 마감임박 알림 삭제 | 별도 신청 마감일이 없다. 발송 트리거를 정의할 수 없다 |
| `genderPolicy` | **삭제** | 남녀 정원이 애초에 분리 모집이라 불필요. dev-plan blocking #4 해소 |
| `TimeSlot` | 3종 → 4종 `MORNING`/`AFTERNOON`/`DINNER`/`LATE_NIGHT` | 삭제한 카테고리 축을 대신한다 |
| `locationPrecision` | **신설** `EXACT`/`STATION`/`DISTRICT` | 정확한 주소가 없는 소개팅이 상당수다. 동 → 지하철역 → 구 순으로 핀을 내린다 |
| `jobGroups` · `createdAt` | **신설** | 참석자 공통 축이 연령대·직업군·남녀 정원 셋이다 / 홈 `새로 등록된` 섹션 정렬용 |

**필터 축 선정 기준**: *모든 주최사 게시물에서 결측 없이 얻을 수 있는가.* 운영자가 손으로 등록하는 단계라 이게 절대적이다. 반쯤 빈 필터는 켜는 순간 멀쩡한 소개팅을 숨겨서 없느니만 못하다.

근거 전문은 `progress.md` **4.6**, 화면 영향은 `frontend-feature-spec.md` **상단 경고 블록**에 있다.

---

## 1. 작업 규칙 — 반드시 지킨다

### 커밋

- **`git commit` / `push` / PR 생성을 절대 스스로 하지 않는다. `git add` 도 하지 않는다.**
- 작업이 끝나면 아래 3가지만 주고 **멈춘다.** "커밋할까요?" 라고 묻지도 않는다.
  1. 변경 요약
  2. 커밋 메시지 초안
  3. GitHub PR 에 붙여넣을 `@claude …` 코드리뷰 멘트
- 범위 동의("그렇게 하자", "이번 PR 에 넣자")를 **실행 승인으로 확대 해석하지 않는다.**

### 커밋 메시지 형식

```
[FE] #<이슈번호> 한글 설명
```

Conventional Commits(`feat(frontend):`)를 쓰지 않는다. 이슈번호를 모르면 **지어내지 말고 묻는다.**

브랜치 이름은 `<type>/fe-<이슈>/<슬러그>` 패턴이다 (`feat/fe-3/phase0`, `refactor/fe-7/domain-redefinition`).

### `@claude` 코드리뷰 멘트 작성법

PR 을 열면 `claude-code-review.yml` 이 **자동으로** 범용 리뷰를 돌린다. 따라서 멘트는
**이번 PR 에서 특히 봐야 할 관점·기준을 지정**해야 값이 있다. "코드리뷰 해줘" 는 중복이라 쓰지 않는다.

### 개발 환경 — 머신 2대

| | 경로 | 호스트 |
| --- | --- | --- |
| 회사 | `C:\MeetMap` | `RMS-PLATFORM` |
| 개인 | `E:\MeetMap` | `DESKTOP-R4N173U` |

**GitHub push/pull 로만 동기화된다.** 세션을 마칠 때 커밋되지 않은 변경이 남아 있으면 **반드시 사용자에게 알린다** — 알리지 않으면 다음 날 다른 머신에서 사라진 것처럼 보인다.

머신을 옮긴 뒤 필요한 것: `git pull` → `npm ci`(락파일이 바뀌었을 수 있음) → `frontend/.env` 확인.
gitignore 라 머신마다 따로 만들어야 하는 것: `frontend/.env`(`.env.example` 복사), `.claude/settings.local.json`, `.idea/`.

---

## 2. 제품 전제 (확정된 결정)

- MeetMap 은 **결제를 대행하지 않는 중개 플랫폼**이다. 신청·결제는 주최사 외부 페이지에서 이뤄진다. → 외부 이동 모달(7.3)의 법적 고지는 **타협 불가**
- 단 이는 **MVP1 한정 전제**다. 서울 외 확장 시 자체 결제(`payment-service` MSA)로 전환할 계획이 있다. API 설계 시 결제 주체가 바뀔 수 있음을 염두에 둔다
- 지도 지역 필터는 **시/도 → 구 2단 계층**을 유지한다. MVP1 이 서울 전용이어도 평평한 칩으로 바꾸지 않는다
- **참석자 리스트는 집계값만 다룬다.** 인스타에 공개돼 있어도 그대로 쓰지 않는다 — 이미지는 주최사 저작물이고, 참석자는 *그 주최사 계정에* 공개 동의한 것이다. 출생연도 범위·직업군·남녀 정원만 저장·표시하고 원본은 아웃링크로 보낸다 (기능정의서 7.2)
- **주최사 등록은 동의 기반이다.** 크롤링해서 무단 등록하지 않는다. 컨택 → 양해 → 등록 순서이며, 동의 범위(정보 등록 / 이미지 사용 / 참석자 리스트 표시)를 기록해야 한다

---

## 3. 코드베이스 지도

FSD 5개 레이어. `app → widgets → features → entities → shared` **단방향**. 역방향·동일 레이어 참조는 **ESLint 가 막는다**(`eslint.config.mjs`). 각 폴더는 `index.ts` 로만 공개한다.

### 이미 있는 것 — 다시 만들지 않는다

| 위치 | 내용 |
| --- | --- |
| `shared/ui/` | `PrimaryButton` `Chip` `SegmentedControl` `Sheet` `Modal` `Toast`(+`useToast`) `Numeric` `Skeleton` `EmptyState` `ErrorState` `Toggle` `Checkbox` `IconButton` |
| `shared/lib/` | `cn` `clampSelection` `highlightKeyword` `useFocusTrap` `useLockBodyScroll` `useIsClient` + 포매터(`formatPrice` `formatEventDate` `formatRelativeTime` `formatDistance` …) |
| `shared/api/` | `fetchClient` `ApiError` `ENDPOINTS` `CursorPage` `paginateArray` |
| `shared/config/` | `constants.ts`(도메인 마스터) `theme.ts` `env.ts` |
| `entities/` | `event`(타입 + `EventApi` 포트 + mock/http 구현 + 목 8건) `user` `notification` `review` `account`(역할·라우트 가드) |
| `widgets/` | `app-header` `bottom-nav` |
| `app/` | `(main)` `(stack)` `(onboarding)` 3개 라우트 그룹 셸 + 자리표시자 페이지 |
| `src/proxy.ts` | 라우트 가드 (미들웨어 아님 — 4장 참조) |

`features/` 는 **비어 있다.** Phase 1 에서 처음 채운다.

> `entities/event/model/derive.ts` 에 파생 규칙이 모여 있다 — `deriveScale` `isThisWeek` `priceFor` `isEligible`. 자격·가격 판정을 화면에서 다시 구현하지 않는다. 목 모드의 "인증 주체"(출생연도·성별)는 `entities/event/mock/viewer.ts` 의 `MOCK_VIEWER` 다.

### 목업 위치 — 리포지토리에 없다

목업 10종(`MeetMap User v2` / `Actions` / `My` / `Support` / `Onboarding` / `Common` / `Provider` / `Provider Manage` / `Admin` / `Admin Manage`)은 **Claude Design 캔버스**의 `MeetMap UI/UX 작업` 프로젝트에 있다. git 에 없으므로 파일로 열 수 없다. 필요하면 사용자에게 URL 을 요청한다.

10종 전부 2026-09-01 에 손봤으나 **User v2 / Actions / My 에 옛 값(카테고리·잔여석·성비 게이지·단일 가격)이 남아 있다**(`progress.md` 5장). 목업과 기능정의서가 어긋나면 **기능정의서가 사양의 원본**이다.

### 데이터 가져오는 법

백엔드가 없으므로 목으로 개발한다. **화면은 `eventApi` 만 알면 된다.**

```ts
import { eventApi } from "@/entities/event";
const feed = await eventApi.getHomeFeed({});
```

목/실 분기는 `entities/event/api/eventApi.ts` 마지막 줄 + `NEXT_PUBLIC_USE_MOCK` 한 곳에서만 일어난다.
**컴포넌트에 `if (USE_MOCK)` 을 쓰지 않는다.**

개발용 역할 스위치: 브라우저 콘솔에서 `document.cookie = "meetmap_mock_role=USER;path=/"` (값 예: `USER`, `PROVIDER:PENDING`, `ADMIN`). 쿠키가 없으면 게스트.

### 확인 방법

- `/design-system` — shared/ui 전 컴포넌트가 렌더되는 페이지. 새 공통 컴포넌트를 만들면 여기에도 추가한다
- `npm test`(vitest) / `npm run lint` / `npm run build`
- 개발 서버는 3001 포트. Bash 로 띄우지 말고 Browser 도구(`preview_start`)를 쓴다

---

## 4. 함정 — 모르면 반드시 틀린다

### Next.js 16 (학습 데이터와 다름)

- **`middleware.ts` 는 deprecated → `proxy.ts`** 규약을 쓴다. 이 프로젝트는 `src/proxy.ts` 에 있다
- **`params` / `searchParams` / `cookies()` 는 Promise.** 동기 접근이 제거됐다. `await props.params`
- Turbopack 이 기본. 코드 쓰기 전 `node_modules/next/dist/docs/` 확인 (`AGENTS.md` 지침)

### 이 제품에서 굳은 UI 패턴 — 어기면 일관성이 깨진다

- **비활성 버튼의 라벨이 미충족 사유를 말한다.** (`필수 약관에 동의해주세요`) 별도 에러 토스트를 띄우지 않는다
- **탐색 필터·정렬·뷰는 URL 쿼리스트링이 원본.** `useState` 로 들고 있지 않는다
- **홈에는 필터를 두지 않는다.** 퀵 필터 칩 바는 삭제됐다. 필터는 탐색 화면 한 곳에만 있다 (기능정의서 5.4). 홈에서 화면을 떠나는 경로는 `전체보기 >` 3개와 지도 프로모 카드뿐이다
- **적용된 필터는 눈에 보여야 한다.** 탐색 상단의 적용 필터 칩 줄(6.2)이 그 역할이다. 홈 프리셋을 물고 들어왔는데 화면에 안 보이면 결과가 왜 좁은지 알 수도 풀 수도 없다
- **연령은 필터가 아니라 자격이다.** 프로필 출생연도로 처음부터 걸러 보여주고(`eligibleOnly`), 넓히고 싶을 때 끄게 한다
- **가격은 사용자 성별 기준값만 노출한다.** 상세에서는 남·여 양쪽을 모두 표기한다. 게스트는 병기
- **가격·평점·카운터 숫자는 세리프.** `shared/ui/Numeric` 으로만 통과시킨다
- **칩·필터를 가로 스크롤로 만들지 않는다.** `flex-wrap` 을 쓴다. 홈의 카드 캐러셀만 예외
- **`--color-accent` 위에 흰 텍스트를 올리지 않는다.** 대비 1.6:1 로 WCAG 미달. `text-text` 를 쓴다
- 색상을 컴포넌트에 하드코딩하지 않는다. Tailwind 토큰(`bg-accent`, `text-text-sub`)을 쓴다
- 접근성은 만들 때 넣는다: `div + onClick` 금지, 터치 타깃 44×44, 시트·모달 포커스 트랩

### 코드 작성 시 주의

- `position: fixed` 오버레이는 **`document.body` 로 포털**한다. 조상의 `transform`/`backdrop-filter` 에 갇힌다 (`progress.md` 4.8)
- `Intl.DateTimeFormat` 을 렌더마다 만들지 않는다. 모듈 스코프에서 공유한다 (4.9)
- 서버 fetch 에 `signal` 을 붙이면 Next 요청 메모이제이션이 꺼진다 (4.7)
- `cn()` 은 Tailwind 클래스 충돌을 해결하지 않는다. `className` 오버라이드 시 기본값과 겹치지 않는 유틸리티를 넘긴다

### 테스트

순수 함수는 테스트를 함께 넣는다. **통과하는 테스트를 믿지 않는다** — 새 테스트는 **일부러 코드를 깨뜨려 실패하는지 확인**한다(변이 테스트). 이 관행을 유지한다.

---

## 5. 다음 작업 — Phase 1

`dev-plan.md` 2장 Phase 1 표, `frontend-feature-spec.md` 5·6·7·11·14장 참조.

### P1-0 — 데이터 모델을 코드에 반영 ✅ 완료 (#9 / `0fa3efb`)

아래 표는 **무엇이 어떻게 바뀌었는지의 지도**로 남긴다. 근거는 `progress.md` 3장 · 4.13~4.15.

| 파일 | 바뀐 것 |
| --- | --- |
| `entities/event/model/types.ts` | `EventSummary`/`EventDetail` 교체. 12장에 없는 `stationName` 을 하나 추가했다 — 6.6 마커 시트가 `○○역 인근` 을 그려야 하는데 담을 자리가 없었다 (`progress.md` 4.13) |
| `entities/event/model/derive.ts` 🆕 | `deriveScale` `isThisWeek`/`weekRangeKst` `priceFor` `isEligible`. **자격·가격 판정을 화면에서 다시 짜지 않는다** |
| `shared/config/constants.ts` | `CATEGORIES`·`GENDER_FILTERS`·`ONLY_20S_MAX_AGE`·`DEADLINE_ALERT_SEAT_THRESHOLD` 삭제. `TIME_SLOTS` 4종, `WHEN_OPTIONS`·`SCALE_OPTIONS`·`PRICE_CAPS`·`JOB_GROUPS` 신설 |
| `entities/event/mock/events.ts` | 목 8건 전면 교체 (로테이션 소개팅). 경계값을 섞어 뒀다 — 가격 `null` 1건 / 후기 0건 1건 / `마감` 1건(인기 2위라 홈 첫 화면에 뜬다) / `locationPrecision` 3종 / `scale` 3종 / `timeSlot` 4종 / 이번 주 5건·그 이후 3건 |
| `entities/event/mock/viewer.ts` 🆕 | `MOCK_VIEWER`(1996년생·여). `eligibleOnly`·`maxPrice`·가격 정렬은 쿼리에 성별·출생연도를 싣지 않으므로(13장) 목에서 인증 주체를 대신한다 |
| `entities/event/api/eventApi.mock.ts` | 필터를 `when`·`scale`·`status`·`maxPrice`·`eligibleOnly` 로, 홈 3섹션을 `weeklyPopular`/`myAgeGroup`/`newlyAdded` 로 |
| `entities/user` · `entities/notification` | `interestCategories` / `NotificationSettings.deadlineAlert` / `urgent` kind 삭제 |

**P1-1 이후가 알아야 할 전제 3가지**

- **남녀 정원은 동수다** (`7:7`·`15:15`). 성비 게이지를 그리지 않고 `남 N · 여 N` 으로 표기한다. 필드를 둘로 유지한 건 예외를 받기 위해서다 (`progress.md` 4.14)
- **`sort=latest` 는 `createdAt` 기준**이다. 개최일 임박순이 아니다
- **`maxPrice` 는 가격 미확인(`null`) 건을 제외**한다. 카드에서는 `링크 확인` 으로 떨어진다

### 착수 순서

~~P1-0 데이터 모델~~(완료, #9) → **P1-1 `EventCard` variant** → P1-2 배지·정원·가격 → P1-3 홈 → P1-4 탐색 리스트 → P1-5 필터 시트 → **P1-5c 적용 필터 칩 줄** → P1-5b 지역 시트 → P1-6 정렬/뷰 → P1-7 상세 → P1-8 외부 신청 모달 → P1-9 빈 상태·에러·로딩

**P1-1 요점**: `feature`(홈 가로 196px) / `ratio`(홈 `내 나이대` — 정원 `남 N · 여 N` 표기, **성비 바 아님**) / `compact`(가로 62~66px) / `list`(가로 84~92px) / `sheet`(마커 시트 88px). 한 컴포넌트에 `variant` prop 으로 통합한다(기능정의서 14.1). 위치는 `entities/event/ui/`.

**P1-3 요점**: 홈은 헤더 → 헤드라인·추천 기준 → 지도 프로모 카드 → 섹션 3개(`이번 주 인기` / `내 나이대` / `새로 등록된`) 순이다. **퀵 필터 칩 바는 만들지 않는다.** 게스트는 `내 나이대` 섹션을 숨기고 `새로 등록된` 을 위로 올린다.

**P1-5 요점**: 필터 시트는 3층이다 — 상단 `내가 신청 가능한 것만` 토글(칩 아님) / 일정·시간대 / 규모·분위기·가격·모집 상태. 초기화는 2·3층만 대상이고 자격 토글은 건드리지 않는다.

**Phase 1 DoD**: 로그인 없이 홈 → 탐색 → 상세 → 외부 이동까지 목 데이터로 끊김 없이 진행된다.

### 막힌 것 — 착수 전 확인

| 항목 | 막는 것 |
| --- | --- |
| 서버 상태 라이브러리(TanStack Query) 미도입 | P1-4 무한 스크롤, P2-7 찜 낙관적 업데이트. 직접 구현 비용을 감안하면 도입 권장이나 미결정 |
| 페이지네이션 방식 | 커서 + 무한 스크롤 기본안으로 진행 중 |
| **하단 탭 `지도` → `탐색`(리스트 기본) 개편 여부** | P1-4·P1-6. `전체보기 >` 로 리스트에 도착하는데 하단 탭은 `지도` 가 켜진다. 사용자가 문제 제기했으나 **미결** |

> **해소된 blocking 2건.**
> - `genderPolicy` — 성별 조건 필터를 삭제하고 남녀 정원 분리로 대체했다.
> - **직업군 마스터 정규화** — 직업군은 필터 축이 아니라 상세 표시 전용이고, 값은 등록 폼에서 자유 입력되는 태그다. 표기 수렴은 Phase 6/7 등록 폼의 과제로 내려갔다 (`progress.md` 4.15 / `dev-plan.md` #11).

**P1-8 은 타협 불가.** 결제 비대행 고지·조건 확인 블록·하단 경고가 전부 들어가야 하고, 이 모달을 우회하는 진입 경로(지도 마커 시트의 신청 버튼 포함)를 만들지 않는다. 조건 확인 블록은 참가 연령(`N~N년생`)·모집 정원(`남 N · 여 N`)·참가비(남·여 양쪽)이며 `신청 마감` 항목은 없다.

---

## 6. 이 문서의 갱신

Phase 가 끝날 때, 또는 위 규칙·전제가 바뀔 때 갱신한다.
진행 현황·작업 이력·기술 결정은 여기 적지 않는다 — `progress.md` 가 원본이다.
