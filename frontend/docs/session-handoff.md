# 세션 인수인계 — Claude 전용

> **이 문서의 용도**: 새 Claude Code 세션이 **맨 먼저 한 번 읽는** 온보딩 문서다.
> 코드베이스를 다시 탐색하지 않고 바로 작업에 들어가기 위한 것이다.
> 사람용 문서가 아니므로 간결함이 우선이다. 세부는 아래 문서를 가리킨다.
>
> **읽는 순서**: 이 문서 → `progress.md` 2·4·5장 → 착수할 Phase 의 `dev-plan.md` 항목 → 해당 `frontend-feature-spec.md` 장
>
> 마지막 갱신: 2026-09-01 (도메인 재정의 반영)
>
> ## ⚠️ 먼저 알아야 할 것 — 2026-09-01 도메인 재정의
>
> MeetMap 은 **인스타그램에 개인 단위로 흩어진 로테이션 소개팅을 한곳에 모아 비교·탐색하게 해주는 통합 플랫폼**이다. 소개팅을 직접 주최하지 않고, 신청·결제는 주최사 기존 폼으로 리다이렉트한다. 일반 모임은 코어가 아니라 추후 확장 옵션이다.
>
> 이 재정의로 **데이터 모델과 필터 축이 바뀌었다. 문서는 갱신됐지만 `src/` 코드는 아직 이전 모델이다.** Phase 1 착수 전에 코드 반영이 선행된다.
>
> 반드시 읽을 것: `progress.md` **4.6**(결정 근거 전문) → `frontend-feature-spec.md` **상단 경고 블록**.
>
> 요약: `category` 삭제 / 상태 2개(`신청 가능`·`마감`) / `remainingSeats`·`femaleRatio`·`applyDeadline`·`genderPolicy` 삭제 / 연령은 출생연도 범위 / 가격은 남녀 분리 / `TimeSlot` 4종(오전·오후·디너·심야) / `locationPrecision`·`jobGroups` 신설.

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

> **착수 전 선행 작업.** 도메인 재정의를 `src/` 에 먼저 반영한다 — `entities/event/model/types.ts`, `shared/config/constants.ts`(`CATEGORIES` 삭제, `TIME_SLOTS` 4종), `entities/event/mock/events.ts` 8건 전면 교체, `entities/user/model/types.ts`(`interestCategories` 삭제), `entities/notification/`(`urgent` 삭제). 이걸 건너뛰고 P1-1 부터 만들면 카드가 존재하지 않는 필드를 그리게 된다.

착수 순서: **P1-1 `EventCard` 5 variant** → P1-2 배지·정원·가격 → P1-3 홈 → P1-4 탐색 리스트 → P1-5 필터 시트 → P1-5b 지역 시트 → P1-6 정렬/뷰 → P1-7 상세 → P1-8 외부 신청 모달 → P1-9 빈 상태·에러·로딩

**P1-1 요점**: `feature`(홈 가로 196px) / `ratio`(정원 `남 N · 여 N` 표기 — 성비 바 아님) / `compact`(가로 62~66px) / `list`(가로 84~92px) / `sheet`(마커 시트 88px). 한 컴포넌트에 `variant` prop 으로 통합한다(기능정의서 14.1). 위치는 `entities/event/ui/`.

**Phase 1 DoD**: 로그인 없이 홈 → 탐색 → 상세 → 외부 이동까지 목 데이터로 끊김 없이 진행된다.

### 막힌 것 — 착수 전 확인

| 항목 | 막는 것 |
| --- | --- |
| **도메인 재정의 코드 미반영** | Phase 1 전체. 위 선행 작업 참조 |
| **목업이 이전 정의 기준** | User v2 / Actions / My 에 카테고리·잔여석·성비 게이지·단일 가격이 남아 있다. **충돌 시 기능정의서를 따른다** |
| 직업군 마스터 미정규화 | P1-5 필터. 주최사마다 표기가 제각각 |
| 서버 상태 라이브러리(TanStack Query) 미도입 | P1-4 무한 스크롤, P2-7 찜 낙관적 업데이트. 직접 구현 비용을 감안하면 도입 권장이나 미결정 |
| 페이지네이션 방식 | 커서 + 무한 스크롤 기본안으로 진행 중 |

**P1-8 은 타협 불가.** 결제 비대행 고지·조건 확인 블록·하단 경고가 전부 들어가야 하고, 이 모달을 우회하는 진입 경로(지도 마커 시트의 신청 버튼 포함)를 만들지 않는다.

---

## 6. 이 문서의 갱신

Phase 가 끝날 때, 또는 위 규칙·전제가 바뀔 때 갱신한다.
진행 현황·작업 이력·기술 결정은 여기 적지 않는다 — `progress.md` 가 원본이다.
