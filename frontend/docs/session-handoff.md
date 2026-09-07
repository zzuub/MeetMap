# 세션 인수인계 — Claude 전용

> 새 세션이 **맨 먼저, 이것만** 읽는다. 여기 없는 건 필요할 때 아래 표에서 찾아 편다.
> 마지막 갱신: 2026-09-07 (**P1-6 정렬 완료** — 뷰 토글은 P3-1 로 이월 / 목 날짜를 상대값으로)

## 어디에 무엇이 있나

| 알고 싶은 것 | 문서 |
| --- | --- |
| 지금 어디까지 했나 / 다음은 뭔가 | [progress.md](progress.md) 1·2장 |
| **Phase 1 착수 요점 · 막힌 것** | [phase1-notes.md](phase1-notes.md) |
| 화면 사양 | [spec/00-index.md](spec/00-index.md) → 해당 화면 파일 |
| 왜 이렇게 짰나 (되돌리기 어려운 판단) | [decisions.md](decisions.md) |
| 무엇을 어떤 순서로 만드나 | [dev-plan.md](dev-plan.md) |
| FSD 레이어 규칙 | [`src/README.md`](../src/README.md) |

MeetMap 은 **인스타그램에 흩어진 로테이션 소개팅을 한곳에 모아 비교·탐색하게 해주는 플랫폼**이다. 소개팅을 직접 주최하지 않고, 신청·결제는 주최사 폼으로 리다이렉트한다. 성장 단계는 ① 운영자 대신 등록 → ② 주최사 셀프서비스 → ③ 결제 내재화 순이며 **현재는 ①** 이다.

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
브랜치는 `<type>/fe-<이슈>/<슬러그>` 패턴이다 (`feat/fe-3/phase0`).

### `@claude` 코드리뷰 멘트

PR 을 열면 `claude-code-review.yml` 이 **자동으로** 범용 리뷰를 돌린다. 멘트는 **이번 PR 에서 특히 봐야 할 관점·기준을 지정**해야 값이 있다. "코드리뷰 해줘" 는 중복이라 쓰지 않는다.

### 개발 환경 — 머신 2대

| | 경로 | 호스트 |
| --- | --- | --- |
| 회사 | `C:\MeetMap` | `RMS-PLATFORM` |
| 개인 | `E:\MeetMap` | `DESKTOP-R4N173U` |

**GitHub push/pull 로만 동기화된다.** 세션을 마칠 때 커밋되지 않은 변경이 남아 있으면 **반드시 사용자에게 알린다** — 알리지 않으면 다음 날 다른 머신에서 사라진 것처럼 보인다.

머신을 옮긴 뒤: `git pull` → `npm ci`(락파일이 바뀌었을 수 있음) → `frontend/.env` 확인.
gitignore 라 머신마다 따로 만드는 것: `frontend/.env`(`.env.example` 복사), `.claude/settings.local.json`, `.idea/`.

---

## 2. 제품 전제 (확정된 결정)

- MeetMap 은 **결제를 대행하지 않는 중개 플랫폼**이다. → 외부 이동 모달(기능정의서 7.3)의 법적 고지는 **타협 불가**
- 단 **MVP1 한정 전제**다. 서울 외 확장 시 자체 결제(`payment-service` MSA)로 전환한다. API 설계 시 결제 주체가 바뀔 수 있음을 염두에 둔다
- 지도 지역 필터는 **시/도 → 구 2단 계층**을 유지한다. MVP1 이 서울 전용이어도 평평한 칩으로 바꾸지 않는다
- **참석자 리스트는 집계값만 다룬다.** 인스타에 공개돼 있어도 그대로 쓰지 않는다 — 이미지는 주최사 저작물이고, 참석자는 *그 주최사 계정에* 공개 동의한 것이다. 출생연도 범위·직업군·남녀 정원만 저장·표시하고 원본은 아웃링크로 보낸다 (기능정의서 7.2)
- **주최사 등록은 동의 기반이다.** 크롤링해서 무단 등록하지 않는다. 컨택 → 양해 → 등록 순이며, 동의 범위(정보 등록 / 이미지 사용 / 참석자 리스트 표시)를 기록해야 한다

---

## 3. 코드베이스 지도

FSD 5개 레이어. `app → widgets → features → entities → shared` **단방향**. 역방향·동일 레이어 참조는 **ESLint 가 막는다**(`eslint.config.mjs`). 각 폴더는 `index.ts` 로만 공개한다.

### 이미 있는 것 — 다시 만들지 않는다

| 위치 | 내용 |
| --- | --- |
| `shared/ui/` | `PrimaryButton` `Chip` `SegmentedControl` `Sheet` `Modal` `Toast`(+`useToast`) `Numeric` `Skeleton` `EmptyState` `ErrorState` `Toggle` `Checkbox` `IconButton` |
| `shared/lib/` | `cn` `clampSelection` `highlightKeyword` `useFocusTrap` `useLockBodyScroll` `useIsClient` + 포매터(`formatPrice` `formatEventDate` …) + **`rating`**(`ratingScore`·`canShowRating`) |
| `shared/api/` | `fetchClient` `ApiError` `ENDPOINTS` `CursorPage` `paginateArray` |
| `shared/config/` | `constants.ts`(도메인 마스터) `theme.ts` `env.ts` |
| `entities/` | `event`(타입 + 포트 + mock/http + 목 8건 + **`ui/EventCard/` 레이아웃 5종·조각 6종** + `labels`) **`provider`**(주최사 4곳·평점) `user` `notification` `review` `account`(역할·라우트 가드) |
| `features/` | **`event-filter`** — `exploreParams`(URL ↔ 조회 파라미터 변환. 6.1 계약) + **필터 시트 · 지역 시트 · 적용 필터 칩 줄 · 상단 컨트롤 · 정렬 `select`** + `exploreFacets`(축별 건수) |
| `widgets/` | `app-header`(`AppHeader` 스택용 · **`HomeHeader`** 홈용) `bottom-nav` **`home-feed`** **`explore-board`** |
| `app/` | `(main)` `(stack)` `(onboarding)` 3개 라우트 그룹 셸 + **홈 `/`** + **탐색 `/explore`**(리스트 뷰. 지도 뷰는 자리표시자) + 나머지는 자리표시자 페이지 |
| `src/proxy.ts` | 라우트 가드 (미들웨어 아님 — 4장 참조) |

`features/` 슬라이스는 `event-filter` 하나다. 탐색의 필터 관련은 **전부 여기** — 다른 슬라이스로 나누면 `serializeExploreParams` 를 참조할 수 없다(동일 레이어 금지).

> `entities/event/model/derive.ts` 에 파생 규칙이 모여 있다 — `deriveScale` `isThisWeek` `priceFor` `isEligible` `marksIneligible` `isOpen` `currentTimeSlot`. 자격·가격 판정을 화면에서 다시 구현하지 않는다. 목 모드의 "인증 주체"(출생연도·성별)는 `entities/event/mock/viewer.ts` 의 `MOCK_VIEWER` 다.

### 목업 — 리포지토리에 없다

목업 10종은 **Claude Design 캔버스**의 `MeetMap UI/UX 작업` 프로젝트에 있다. git 에 없으므로 파일로 열 수 없고, 필요하면 사용자에게 URL 을 요청한다. **User v2 / Actions / My 에는 옛 값이 남아 있다** — 목업과 기능정의서가 어긋나면 **기능정의서가 원본이다** ([spec/15-도메인-재정의-이력.md](spec/15-도메인-재정의-이력.md)).

### 데이터 가져오는 법

백엔드가 없으므로 목으로 개발한다. **화면은 `eventApi` 만 알면 된다.**

```ts
import { eventApi } from "@/entities/event";
const feed = await eventApi.getHomeFeed({});
```

목/실 분기는 `entities/event/api/eventApi.ts` 마지막 줄 + `NEXT_PUBLIC_USE_MOCK` 한 곳에서만 일어난다. **컴포넌트에 `if (USE_MOCK)` 을 쓰지 않는다.**

개발용 역할 스위치: 콘솔에서 `document.cookie = "meetmap_mock_role=USER;path=/"` (`USER`, `PROVIDER:PENDING`, `ADMIN`). 쿠키가 없으면 게스트.

### 코드 컨벤션 — 리뷰에서 걸리는 것들

- **함수 하나가 50줄을 넘으면 쪼갠다.** 변형·분기가 늘어나는 컴포넌트는 `EventCard/` 처럼 **표 + 파일**로 나눈다 (`decisions.md` 4.22)
- **주석은 15~25% 를 넘기지 않는다.** 근거·대안·번복 조건은 `decisions.md` 가 원본이고 소스에는 참조만 남긴다 — 주석은 코드와 함께 안 고쳐져 썩는다
- **테스트에 목 데이터 id 를 쓰지 않는다.** `toEqual(["evt-003"])` 은 목 한 줄만 고쳐도 무관한 테스트를 깨뜨린다. 성질로 단언한다(`expectFilterMatches` 참고)
- `any`·`as any`·`@ts-ignore`·non-null `!` 는 **현재 0건이다.** 유지한다
- **정렬 테스트는 뒤집어 넣어 본다.** 목이 이미 그 축으로 정렬돼 있으면 `Array.sort` 안정성만으로 통과해 비교 함수 버그를 못 잡는다
- **entity 두 슬라이스의 목 데이터가 겹치면** `src/app/_consistency/` 에 교차 검증 테스트를 둔다. 레이어 규칙이 `app` 을 빼고 있어 두 entity 를 함께 볼 수 있는 유일한 자리다 (`decisions.md` 4.21)

### 확인 방법

- `/design-system` — `shared/ui` 전 컴포넌트 + **카드 5종·조각 6종·경계값**이 렌더되는 페이지. 새 공통 컴포넌트를 만들면 여기에도 추가한다
- `npm test`(vitest) / `npm run lint` / `npm run build`
- **날짜 로직을 건드리면 `TZ=America/Los_Angeles npm test` 도 돌린다.** CI 가 그 TZ 와 `Pacific/Kiritimati` 로 한 번 더 돈다 — `weekRangeKst` 가 로컬 TZ 를 읽으면 UTC 로는 통과하고 거기서만 깨진다
- ⚠️ **목 데이터의 날짜에 절대값을 다시 넣지 않는다.** `mock/dates.ts` 의 `schedule(일수, 시각)` 을 쓴다 — `date`·`dateLabel`·`timeLabel` 을 한 순간에서 함께 만들고, 앵커가 `isThisWeek` 와 같은 `weekRangeKst` 라 `이번 주 5건 · 그 이후 3건` 이 구조로 보장된다 (4.31). 절대 날짜였을 때 주가 넘어가며 CI 가 깨졌고, 라벨만 리터럴로 뒀을 때는 8건 전부 일주일씩 어긋났다. **등록일 일수는 전부 음수여야 한다**(미래 등록 방지)
- ⚠️ **목 회차는 `MOCK_EVENTS` 상수가 아니라 `getMockEvents()` 로 가져온다.** 주를 키로 캐시해서 주가 바뀌면 다시 만든다 — 상수로 굳히면 서버를 켜둔 채 주가 넘어갔을 때 `THIS_WEEK` 가 **빈 화면이 아니라 조용히 틀린 건수**(5건 → 2건)가 된다 (4.31). 반환은 `readonly` 다(제자리 정렬 금지)
- ⚠️ **목을 무는 페이지를 정적 프리렌더로 두지 않는다.** 프리렌더되면 빌드한 주의 날짜가 HTML 에 굳는다. `/` 와 `/explore` 는 `cookies()`·`searchParams` 로 이미 동적이고, `/design-system` 은 그 둘을 안 읽어 `force-dynamic` 을 명시했다 (4.31). **`eventApi` 를 쓰는 새 라우트를 만들면 `next build` 의 `○/ƒ` 표시를 확인한다**
- 개발 서버는 3001 포트. Bash 로 띄우지 말고 Browser 도구(`preview_start`)를 쓴다

---

## 4. 함정 — 모르면 반드시 틀린다

### Next.js 16 (학습 데이터와 다름)

- **`middleware.ts` 는 deprecated → `proxy.ts`** 규약. 이 프로젝트는 `src/proxy.ts` 에 있다
- **`params` / `searchParams` / `cookies()` 는 Promise.** 동기 접근이 제거됐다. `await props.params`
- Turbopack 이 기본. 확신이 안 서는 API 만 `node_modules/next/dist/docs/` 에서 확인한다 (`AGENTS.md`)

### 평점 — 임계 두 개를 헷갈리지 않는다

- **표시 임계 5건** — 후기 5건 미만이면 평점 숫자를 숨기고 `후기 N건` 만. 평점은 **항상 건수와 함께** 쓴다(`4.6 (23)`)
- **정렬은 임계를 쓰지 않는다** — 하드 컷은 절벽을 만든다. `ratingScore = (C×m + 평점합)/(C+n)`, `C=10` `m=4.3`. 후기 0건 주최사는 맨 아래가 아니라 **중간**에 놓인다
- **`ratingScore` 를 화면에 노출하지 않는다.** 원본 평균과 나란히 보이면 설명할 수 없다
- **회차에는 평점이 없다.** 평점은 주최사에 쌓이고, 카드 5종은 평점을 그리지 않는다. 평점이 나오는 화면은 상세 주최사 블록(7.1)·주최사 페이지(7.4)·비교함(8장)·후기 목록(10.4) 넷뿐이다 (`decisions.md` 4.19·4.20)
- ⚠️ `entities/event` 는 `entities/provider` 를 **import 할 수 없다**(FSD 동일 레이어). event 가 쓰는 `{ id, name }` 는 event 슬라이스가 직접 정의한다

### 이 제품에서 굳은 UI 패턴 — 어기면 일관성이 깨진다

- **비활성 버튼의 라벨이 미충족 사유를 말한다.** (`필수 약관에 동의해주세요`) 별도 에러 토스트를 띄우지 않는다
- **탐색 필터·정렬·뷰는 URL 쿼리스트링이 원본.** `useState` 로 들고 있지 않는다. 변환은 `features/event-filter` 의 `parseExploreParams`/`serializeExploreParams` 한 곳이고, **알 수 없는 값은 에러가 아니라 기본값으로** 떨어뜨린다 (6.1). **주소를 손으로 조립하지 않는다** — 조건을 걸 때도 풀 때도 `exploreHref` 를 거친다 (4.24)
- **하단 탭 두 번째는 `탐색`(리스트 기본)이다.** 지도는 목적지가 아니라 탐색의 뷰다 — 2026-09-05 개편 (5.5)
- **뷰 토글(`리스트 / 지도`)은 아직 없다. P3-1 에서 붙인다** (4.29). 지도가 없는 동안 세그먼트 절반이 자리표시자로 가기 때문이다 — `누르면 아무 일 없는 컨트롤은 만들지 않는다`. 지금 `?view=map` 은 자리표시자 + `리스트로 보기` 링크이고, P3-1 이 토글을 붙이면서 **둘 다 지운다**
- **정렬은 5종이고 게스트는 가격 정렬을 못 본다.** 옵션을 감추는 것은 화면(`sortChoices` + `hasViewerAxes`)이지만 **값을 막는 것은 파싱(`parseSort`)** 이다 — 손으로 붙인 `?sort=priceDesc` 가 남으면 `select` 가 아무것도 선택 못 한 상태로 뜬다 (4.30). 평점 정렬은 게스트에게도 보인다
- **홈에는 필터를 두지 않는다.** 퀵 필터 칩 바는 삭제됐다. 필터는 탐색 화면 한 곳뿐이다 (기능정의서 5.4)
- **홈은 마감된 소개팅을 받지 않는다.** 세 섹션 전부 모집 중만이고(서버 책임 — `EventApi.getHomeFeed` 계약), 그래서 홈 카드에는 상태 배지가 없다 (`decisions.md` 4.23)
- **건수 0인 선택지는 노출하지 않는다.** 시간대 칩·지역 시트가 그렇다. 건수는 **현재 걸린 다른 필터를 반영**하고, 못 셌으면 건수를 감춘다 (4.28)
- **적용된 필터는 눈에 보여야 한다.** 탐색 상단의 적용 필터 칩 줄(6.2)이 그 역할이다. 지역은 예외 — **상단 지역 버튼 라벨**이 그 자리다 (6.2 표시 제외). **`초기화` 는 둘이고 지우는 대상이 다르다** — 칩 줄 쪽은 자격까지 끄고 시간대를 남기고, 시트 쪽은 자격을 남기고 시간대를 되돌린다 (4.26)
- **연령은 필터가 아니라 자격이다.** 프로필 출생연도로 처음부터 걸러 보여주고(`eligibleOnly`), 넓히고 싶을 때 끄게 한다. **게스트·출생연도 미입력자는 전건**을 본다(판정 근거가 없다), 자격 토글을 **끄면** 자격 밖 카드에 `내 나이대 아님` 을 붙인다 (6.4)
  - ⚠️ **끄기는 파라미터 삭제가 아니라 `eligibleOnly=0` 이다.** 기본이 ON 이라 지우면 되살아난다 (4.25)
  - ⚠️ **게스트 판정을 화면에서 다시 하지 않는다.** 파싱이 게스트에게 `eligibleOnly`·`maxPrice` 키를 안 만들므로 그 유무를 읽는다(`hasViewerAxes`) (4.27)
- **가격은 사용자 성별 기준값만 노출한다.** 상세에서는 남·여 양쪽 표기, 게스트는 병기
- **가격·평점·카운터 숫자는 세리프.** `shared/ui/Numeric` 으로만 통과시킨다
- **칩·필터를 가로 스크롤로 만들지 않는다.** `flex-wrap` 을 쓴다. 홈의 카드 캐러셀만 예외
- **`--color-accent` 위에 흰 텍스트를 올리지 않는다.** 대비 1.6:1 로 WCAG 미달. `text-text` 를 쓴다
- 색상을 하드코딩하지 않는다. Tailwind 토큰(`bg-accent`, `text-text-sub`)을 쓴다
- 접근성은 만들 때 넣는다: `div + onClick` 금지, 터치 타깃 44×44, 시트·모달 포커스 트랩

### 코드 작성 시 주의

- `position: fixed` 오버레이는 **`document.body` 로 포털**한다. 조상의 `transform`/`backdrop-filter` 에 갇힌다 (`decisions.md` 4.8)
- `Intl.DateTimeFormat` 을 렌더마다 만들지 않는다. 모듈 스코프에서 공유한다 (4.9)
- 서버 fetch 에 `signal` 을 붙이면 Next 요청 메모이제이션이 꺼진다 (4.7)
- `cn()` 은 Tailwind 클래스 충돌을 해결하지 않는다. `className` 오버라이드 시 기본값과 겹치지 않는 유틸리티를 넘긴다

### 테스트

순수 함수는 테스트를 함께 넣는다. **통과하는 테스트를 믿지 않는다** — 새 테스트는 **일부러 코드를 깨뜨려 실패하는지 확인**한다(변이 테스트). 이 관행을 유지한다.

---

## 5. 이 문서의 갱신

Phase 가 끝날 때, 또는 위 규칙·전제·함정이 바뀔 때만 갱신한다.
**진행 현황·작업 이력·기술 결정·화면 사양은 여기 적지 않는다** — 각각 `progress.md` · `decisions.md` · `spec/` 이 원본이다. 이 문서가 다시 20KB 가 되면 세션마다 그 값을 치른다.
