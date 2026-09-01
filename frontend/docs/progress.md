# MeetMap 프론트엔드 작업 이력

> 짝 문서
> - `docs/dev-plan.md` — **계획.** 무엇을 어떤 순서로 만들 것인가
> - `docs/frontend-feature-spec.md` — **사양.** 화면별 기능 상세
> - `src/README.md` — **규칙.** FSD 레이어 구조
> - **이 문서** — **기록.** 무엇이 실제로 되었고, 왜 그렇게 만들었는가

---

## 0. 갱신 규칙

**기능을 추가하는 PR 은 이 문서도 같은 PR 안에서 갱신한다.** 나중에 몰아서 쓰면 "왜 그렇게 했는지"가 이미 사라진 뒤다.

| 무엇을 | 어디에 |
| --- | --- |
| 완료한 작업 ID (P0-1 등) | 2장 진행 현황 표의 상태를 갱신 |
| PR 단위 작업 내용 | 3장 맨 위에 새 항목 추가 (최신순) |
| **되돌리기 어려운 판단** | 4장에 항목 추가 — 대안·근거·번복 조건까지 |
| 미룬 것 / 막힌 것 | 5장에 추가하거나, 해소되면 제거 |

4장이 이 문서의 핵심이다. 코드는 *무엇을* 했는지 보여주지만 *왜* 는 보여주지 않는다. 3개월 뒤 "이거 왜 이렇게 돼 있지"에 답하는 게 4장이다.

기록할 가치가 없는 것: 오타 수정, 포맷팅, 자명한 리팩터링.

---

## 1. 현재 상태 요약

기준일 **2026-09-01**

> ⚠️ **2026-09-01 도메인 재정의.** 제품이 "로테이션 소개팅 통합 탐색 플랫폼"으로 좁혀지면서 데이터 모델·필터 축이 바뀌었다. **문서(기능정의서·dev-plan)는 갱신됐고, `src/` 코드는 아직 이전 모델이다.** Phase 1 착수 전에 코드 반영이 선행되어야 한다 → 4.6, 5장.

| 항목 | 값 |
| --- | --- |
| 진행 단계 | **Phase 0 완료.** Phase 1 착수 전 |
| 소스 파일 | 67개 (테스트 제외) / 약 4,200줄 |
| 테스트 | 46개 (3파일), `npm test` |
| 스택 | Next.js 16.3.3 · React 19.2.4 · TypeScript 5 · Tailwind CSS v4 · Vitest 4 |
| 백엔드 | Spring Boot 스켈레톤. **실 API 없음** → 목 데이터로 개발 중 |
| CI | `lint` → `test` → `build` (frontend) / `gradlew build -x test` (backend) |
| 보안 | `npm audit` 0건 |

---

## 2. Phase 진행 현황

작업 ID 는 `docs/dev-plan.md` 기준.

### Phase 0 — 공통 기반 ✅ 완료

| ID | 작업 | 상태 |
| --- | --- | --- |
| P0-1 | 디자인 토큰 (보태니컬 화이트, Tailwind v4 `@theme`) | ✅ |
| P0-2 | 라우트 그룹 셸 `(main)` / `(stack)` / `(onboarding)` | ✅ |
| P0-3 | `shared/ui` 13종 + `shared/lib` 7종 | ✅ |
| P0-4 | 공통 피드백 패턴 (Sheet · Modal · Toast) | ✅ |
| P0-5 | `fetchClient` + `ApiError` 정규화 | ✅ |
| P0-6 | 목 데이터 레이어 (`EventApi` 인터페이스 + mock/http) | ✅ |
| P0-7 | 인증·역할 모델 + `proxy.ts` 라우트 가드 | ✅ |
| P0-8 | 도메인 타입 (기능정의서 12장) | ✅ |
| — | Vitest 도입 + 순수 함수 단위 테스트 | ✅ (#5) |

### Phase 1 — USER 코어 퍼널 ⬜ 미착수

| ID | 작업 | 상태 | 비고 |
| --- | --- | --- | --- |
| P1-1 | `EventCard` 5개 variant | ⬜ | |
| P1-2 | 배지 · 정원 표기 · 성별 기준 가격 | ⬜ | 성비 게이지 삭제 (4.6) |
| P1-3 | 홈 `/` | ⬜ | |
| P1-4 | 탐색 리스트 `/explore` | ⬜ | |
| P1-5 | 필터 시트 | ⬜ | 3층 구조로 재설계됨 (4.6). `genderPolicy` 는 삭제되어 blocking 해소 |
| P1-5b | 지역(구) 선택 시트 | ⬜ | |
| P1-6 | 정렬 / 뷰 토글 | ⬜ | |
| P1-7 | 소개팅 상세 `/events/[id]` | ⬜ | |
| P1-8 | 외부 신청 이동 모달 | ⬜ | **법적 고지 필수. 타협 불가** |
| P1-9 | 빈 상태 / 에러 / 로딩 | ⬜ | |

Phase 2~7 은 `docs/dev-plan.md` 참조.

---

## 3. 작업 이력

### 2026-08-31 · [#5](https://github.com/zzuub/MeetMap/issues/5) → [PR #6](https://github.com/zzuub/MeetMap/pull/6)
**Phase 0 후속 정리, 테스트 기반 구축 및 보안 패치**

- **보안**: `next` 16.2.6 → 16.3.3. `npm audit` high 5건 → 0건
  - `GHSA-6gpp-xcg3-4w24` Middleware/Proxy bypass (Turbopack, App Router) — `proxy.ts` 라우트 가드가 직접 영향 대상이었다
  - postcss / sharp 는 next 전이 의존성으로 함께 해소, brace-expansion / js-yaml 은 `npm audit fix`
- **테스트 기반**: Vitest 도입, 단위 테스트 46개 (`checkAccess` 22 / `paginateArray` 13 / `clampSelection` 11). CI 에 `lint → test → build` 연결
- **구조**: `EventApi` 계약을 `model/ports.ts` 로 분리, `paginate` 를 `shared/api` 의 `paginateArray` 로 승격
- **환경**: `.env.example` 추가, 루트 `.gitignore` 로 `.claude/settings.local.json` 제외
- **문서**: `src/README.md` 에 `shared/config` 마스터 데이터 예외 명시

검증: 변이 테스트로 회귀 검출 확인(정렬 제거 4건 / 커서 경계 반전 4건 / 한도 검사 제거 3건 실패). 업그레이드 후 라우트 가드 9케이스 + 경로 조작 4종 재확인.

### 2026-08-31 · [#3](https://github.com/zzuub/MeetMap/issues/3) → [PR #4](https://github.com/zzuub/MeetMap/pull/4)
**FSD 구조 도입 및 Phase 0 공통 기반 구축**

- `app/` → `src/app/` 이전, FSD 5개 레이어 생성
- P0-1 ~ P0-8 전체 (2장 참조)
- Next.js 16 대응: `middleware.ts` → `proxy.ts`, `params`/`searchParams`/`cookies()` 비동기화
- FSD 레이어 방향을 ESLint `no-restricted-imports` 로 강제

**PR 리뷰 후 수정 9건** — 포털(#1), fetch 메모이제이션(#2), Intl 캐싱(#3), Toast 타이머(#4), SegmentedControl 포커스(#5), 규칙 정렬(#9), 잠금 카운트 클램프, ErrorState 언마운트 가드, 데드 CSS 제거.

검증: 라우트 가드 10케이스, 목 API 9케이스 실측.

### 2026-08-07 · [PR #2](https://github.com/zzuub/MeetMap/pull/2)
**Claude GitHub Actions 설정** — `claude.yml`(`@claude` 수동 호출) + `claude-code-review.yml`(PR 자동 리뷰)

---

## 4. 주요 기술 결정

되돌리기 어렵거나, 나중에 "왜?"가 나올 판단만 기록한다.

### 4.1 FSD 레이어 경계를 ESLint 로 강제한다

`app → widgets → features → entities → shared` 단방향. 역방향·동일 레이어 참조 금지.

**왜**: 문서로만 두면 지켜지지 않는다. `eslint.config.mjs` 의 `no-restricted-imports` 로 막아 빌드 전에 걸리게 했다.

**부작용**: 동일 레이어 참조가 막히므로, 여러 entity 가 공유하는 데이터는 `shared` 로 올라갈 수밖에 없다 → 4.2 의 원인.

### 4.2 `shared/config` 에 도메인 마스터 데이터를 둔다 (`shared` 원칙의 예외)

`AREAS` · `SEOUL_DISTRICTS` · `MOOD_TAGS` · `REVIEW_TAGS` · `TIME_SLOTS`. (`CATEGORIES` 는 4.6 으로 삭제 예정)

**왜**: `src/README.md` 는 `shared` 를 "도메인 지식이 없는 자원"이라 정의하므로 표면적으로 충돌한다. 그러나 **옮길 곳이 없다.** `AREAS` 는 event(개최 지역)와 user(선호 지역)가 함께 쓴다. `entities/event` 에 두면 `entities/user` 가 참조해야 하는데 그건 4.1 이 금지한다.

**한계**: 값의 목록만 둔다. 도메인 규칙·판정 함수는 두지 않는다.

**번복 조건**: 백엔드가 마스터 API 를 제공하면 이 파일은 타입 소스 겸 fallback 으로 축소된다.

### 4.6 도메인 재정의 — 목업에 있으나 실재하지 않는 값을 걷어낸다 (2026-09-01)

제품 정의가 **"인스타그램에 개인 단위로 흩어진 로테이션 소개팅을 모아 비교·탐색하게 하는 플랫폼"** 으로 확정됐다. 실제 주최사 운영 방식을 조사한 결과, 목업이 전제한 값 중 **도메인에 존재하지 않는 것**이 드러났다.

| 삭제·변경 | 이유 |
| --- | --- |
| `category` **삭제** | 상품 종류가 로테이션 소개팅 하나다. 취미 카테고리(와인/전시/러닝)는 성립하지 않고, 게시물에서 **추출 자체가 안 된다** |
| `remainingSeats` **삭제**, `EventStatus` 3→2 (`신청 가능`/`마감`) | 선착순이 아니라 **주최사가 지원자를 심사해 선발**한다. 마감을 선언하기 전까지 계속 받으므로 잔여 좌석이라는 값이 없다 |
| `femaleRatio` **삭제** → `maleCapacity`/`femaleCapacity` | 정원이 남녀 고정(7:7, 15:15)이라 성비는 항상 50%다 |
| `minAge`/`maxAge` → `birthYearFrom`/`birthYearTo` | 주최사는 나이가 아니라 **출생연도**로 모집한다 (`90~96년생`) |
| `price` → `malePrice`/`femalePrice` (nullable) | 남녀 가격이 다르다. 가격이 신청 폼 안에만 있어 등록 시 확보하지 못하는 건이 있다 |
| `applyDeadline` **삭제**, 마감임박 알림 삭제 | 별도 신청 마감일이 없다. 발송 트리거를 정의할 수 없다 |
| `genderPolicy` **삭제** | 남녀 정원이 애초에 분리 모집이라 별도 정책 필드가 불필요. dev-plan blocking #4 해소 |
| `TimeSlot` 3→4 (`MORNING`/`AFTERNOON`/`DINNER`/`LATE_NIGHT`) | 삭제한 카테고리 축을 대신한다 |
| `locationPrecision` **신설** | 정확한 주소가 없는 소개팅이 상당수다. 동 → 지하철역 → 구 순으로 핀을 내리고 정밀도를 표시한다 |
| `jobGroups` **신설** | 참석자 정보의 공통 축은 연령대·직업군·남녀 정원 세 가지다 |

**필터 축 선정 기준**: *모든 주최사 게시물에서 결측 없이 얻을 수 있는가.* 내가 손으로 등록하는 단계라 이게 절대적이다. 반쯤 빈 필터는 켜는 순간 멀쩡한 소개팅을 숨겨서 없느니만 못하다. 이 기준으로 카테고리는 탈락하고, 시간대·정원·날짜·지역이 1급 축이 됐다.

**연령을 필터가 아니라 자격으로 올린 이유**: 92년생이 `95~02년생 전용`을 봐도 의미가 없다. 온보딩에서 받은 출생연도로 처음부터 걸러 보여주고(`eligibleOnly`), 넓히고 싶을 때 끄게 한다.

**참석자 리스트**: 인스타에 공개돼 있어도 그대로 쓰지 않는다. 이미지는 주최사 저작물이고, 개별 참석자는 **그 주최사 계정에** 공개 동의한 것이다. MVP1은 **집계값만** 저장·표시하고, 원본은 아웃링크로 보낸다 (기능정의서 7.2).

**번복 조건**: 주최사 셀프서비스(Phase 7) 진입 후 상품 유형이 실제로 분화하면(예: 소셜링/파티/1:1) 그때 카테고리 축을 다시 만든다.

**미반영**: 이 결정은 **문서에만 반영됐다.** `src/` 코드(타입·상수·목데이터·UI)는 아직 이전 모델이다 → 5장.

### 4.3 목/실 API 를 인터페이스 하나로 분기한다

계약은 `entities/event/model/ports.ts` 의 `EventApi`, 구현은 `api/` 에 mock 과 http 둘. 분기는 `eventApi.ts` 마지막 한 줄 + `NEXT_PUBLIC_USE_MOCK`.

**왜**: 백엔드가 비어 있어 프론트가 기다릴 수 없다. 화면은 계약만 알므로 실 API 전환이 환경변수 한 줄이 된다. 컴포넌트에 `if (USE_MOCK)` 을 쓰지 않는다.

**검증됨**: `USE_MOCK=false` 빌드에서 목 데이터가 JS 산출물에 남지 않는다(서버 0 / 클라이언트 0). 트리셰이킹 정상.

### 4.4 계정과 역할을 분리한다 (`Account` 1:N `Membership`)

**왜**: 같은 사람이 개인 회원이면서 주최사 담당자일 수 있다. 계정에 `role` 컬럼 하나를 박으면 나중에 계정을 새로 파야 한다.

**단**: UI 에서는 한 번에 하나의 역할만 활성화한다.

### 4.5 ADMIN 은 소셜 로그인을 쓰지 않는다

`AuthIntent` 유니온에서 `ADMIN` 을 의도적으로 제외했다.

**왜**: ① 소셜 계정 하나가 털리면 운영자 권한이 통째로 넘어간다 ② 퇴사자 계정 회수를 우리가 통제할 수 없다(계정 소유권이 개인에게 있다) ③ 2FA·IP 제한 같은 내부 통제를 소셜 위에 얹기 어렵다.

역할 의도는 **서버가 서명한 OAuth `state`** 로만 전달한다. 콜백 바디의 `role` 을 믿으면 `role: "ADMIN"` 한 줄이 권한 상승이 된다.

### 4.6 `proxy.ts` 는 UX 가드이지 보안 경계가 아니다

**왜**: 토큰 서명을 검증하지 않는다. 엣지에서 검증하려면 공개키 배포가 필요한데 그 복잡도만큼의 이득이 없다 — 위조 토큰으로 화면을 열어도 데이터는 서버가 막는다.

**따라서**: API 서버가 매 요청 권한을 재검증해야 한다. 이 파일을 통과했다는 사실에 기대는 백엔드 코드를 쓰지 않는다.

### 4.7 서버 렌더에서는 fetch 에 `signal` 을 붙이지 않는다

**왜**: Next 는 한 렌더 안의 동일 GET 요청을 메모이즈하는데, **`signal` 을 넘기면 이 메모이제이션이 꺼진다**(공식 문서). 타임아웃에는 `signal` 이 필요하므로 둘은 양립하지 않는다.

**측정**: 같은 URL 을 코드에서 2번 호출할 때 — signal 있음 → 네트워크 2회 / signal 없음 → **1회**.

**결론**: 브라우저는 기본 타임아웃(메모이제이션 대상이 아님), 서버는 `timeoutMs` 를 명시할 때만. 서버 타임아웃은 게이트웨이 계층의 책임으로 본다.

### 4.8 `Sheet` / `Modal` 은 `document.body` 로 포털한다

**왜**: `position: fixed` 는 조상에 `transform` / `filter` / `backdrop-filter` / `contain` / `will-change` 가 하나라도 있으면 뷰포트가 아니라 **그 조상** 기준이 된다. 이미 `backdrop-blur` 를 헤더·하단내비에서 쓰고 있고, Phase 3 지도 컨테이너에서 터질 예정이었다.

**측정**: 조상에 `transform` 을 넣었을 때 — 제자리 렌더 `320×200, top:2467`(화면 밖) / 포털 `375×812, top:0`.

**부수 효과**: SSR 게이팅이 필요해졌다. `useEffect(() => setMounted(true), [])` 는 이펙트 내 동기 setState 라 린트에 걸리므로 `useIsClient`(`useSyncExternalStore`)를 썼다.

### 4.9 `Intl.DateTimeFormat` 인스턴스를 공유한다

**왜**: 생성자가 로케일 데이터를 해석해 무겁다. 호출마다 만들면 탐색 리스트 20건 × (날짜+시간) = 렌더당 40개 단명 객체.

**측정**: 12,000회 호출 — 호출마다 생성 667ms / 인스턴스 공유 62ms. **10.8배**.

### 4.10 Vitest 를 쓰되 jsdom 은 붙이지 않는다

**왜**: 현재 테스트 대상이 순수 함수뿐이라 DOM 이 필요 없다. 실행이 빠르고 의존성도 줄어든다. React 컴포넌트 테스트가 필요해지면 그때 `jsdom` + `@testing-library/react` 를 추가하고 `environmentMatchGlobs` 로 파일별로 나눈다.

**통과하는 테스트를 믿지 않는다**: 새 테스트를 넣을 때는 **일부러 코드를 깨뜨려 실패하는지 확인**한다(변이 테스트). 이 관행을 유지한다.

### 4.11 의존성은 정확한 버전으로 고정한다 (캐럿 미사용)

**왜**: create-next-app 의 기존 컨벤션을 유지한다. 락파일이 커밋되어 있고 CI 가 `npm ci` 를 쓰므로 재현성은 어느 쪽이든 같지만, 업그레이드를 명시적 행위로 남긴다.

---

## 5. 미해결 항목

Phase 착수를 막는 것부터. 전체 목록은 `docs/dev-plan.md` 4장 + 기능정의서 16장.

| 항목 | 막는 것 | 상태 |
| --- | --- | --- |
| **도메인 재정의 코드 반영** | Phase 1 전체 | **문서만 갱신됨.** `types.ts`·`constants.ts`(`CATEGORIES` 삭제, `TIME_SLOTS` 4종)·목데이터 8건 전면 교체·`EventCard` variant 가 남아 있다 → 4.6 |
| **목업 갱신** | Phase 1 UI | User v2 / Actions / My 목업에 카테고리·잔여석·성비 게이지·단일 가격이 그대로다. 기능정의서가 목업보다 우선한다고 상단에 명시해 둠 |
| **직업군 마스터 정규화** | P1-5 필터 | 주최사마다 표기가 제각각. dev-plan 4장 #11 |
| **주최사 등록 동의 절차·증빙** | Phase 6 | 컨택 → 동의 → 등록. 동의 범위(정보/이미지/참석자 리스트) 기록 위치 미정. dev-plan 4장 #13 |
| **정기 반복 일정 등록** | Phase 6 | "매주 토요일"이 다수. 반복 규칙 없으면 운영자가 매주 수십 건 수기 입력. dev-plan 4장 #12 |
| **참여 인증 정책·API** | Phase 5 전체 | 미정 |
| **Admin · Provider 기능정의서** | Phase 6 / 7 | 목업 10종은 존재하나 화면 상세 기능정의가 문서화되지 않음 |
| 지도 SDK 선정 + 클러스터링 | Phase 3 | 카카오맵 권장, 미확정 |
| 서버 상태 라이브러리 (TanStack Query) | Phase 1 | 미도입. 찜 낙관적 업데이트·무한 스크롤 직접 구현 비용을 감안하면 도입 권장 |
| 초기 소개팅 데이터 공급 주체 | Phase 6/7 순서 | 운영자 전제로 `USER → ADMIN → PROVIDER` 진행 중 |

### 알려진 기술 부채

- **`cn()` 이 Tailwind 클래스 충돌을 해결하지 않는다** — 문자열 결합만 한다. 컴포넌트 `className` 오버라이드 시 기본값과 겹치지 않는 유틸리티를 넘겨야 한다. 충돌이 실제로 문제되면 `tailwind-merge` 도입 검토
- **`PrimaryButton` 이름과 책임 불일치** — `variant="secondary"` 를 받는다. 기능정의서 14장 명칭을 따른 것
- **`.idea/` 가 이미 git 에 추적되고 있다** — `.gitignore` 에 넣어도 효과가 없다. 제거하려면 `git rm --cached` 가 필요하고 backend 까지 영향. 미결정
- **`src/app/test/page.tsx`** — create-next-app 잔재. 라우트 충돌은 없으나 제거 여부 미정
