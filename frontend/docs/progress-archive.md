# 작업 이력 — 보관

Phase 0 부터 **#19(P1-5 필터 시트)** 까지의 이력이다. 현재 작업에는 필요 없다.
최근 이력은 [progress.md](progress.md) 3장에 있다.

---

## 3. 작업 이력 (보관분)

### 2026-09-05 · [#19](https://github.com/zzuub/MeetMap/issues/19) · [PR #23](https://github.com/zzuub/MeetMap/pull/23)
**코드리뷰 반영 — 전환 표시가 시간대 칩에만 빠져 있었다**

리뷰가 짚은 것은 원칙의 구멍이다. 이 PR 은 "전환 표시를 **누른 자리**에 붙인다"를 내세웠는데, 정작 **사용자가 가장 먼저 누르는 컨트롤**인 상단 시간대 칩이 거기서 빠져 있었다. `pending`(`useTransition`)을 `FilterSheet` 에만 넘기고 `TimeSlotChips` 에는 안 넘겨서, 시트를 열지 않고 시간대 칩을 바로 누르면 같은 `go()` 를 타는데도 아무 반응이 없었다.

- **`TimeSlotChips` 에 `pendingSlot`** — 누른 칩만 `aria-busy` + 흐리게. 적용 필터 칩 줄과 같은 표시다
- **`lastSlot`** — 어느 칩을 눌렀는지만 기억한다. 전환이 끝나면 `pending` 이 내려가면서 표시도 같이 사라지므로 **되돌리는 코드가 없다**(효과·정리 불필요)

**리뷰가 확인해 준 것 둘.** ① 게스트 게이트(4.27)는 새는 경로가 없다 — `patched()` 와 시트의 로컬 `patch()` 둘 다 `undefined` 키를 지우고, 자격·가격을 세팅하는 호출부가 전부 `hasViewerAxes` 뒤에 있어 게스트 경로로는 도달하지 않는다. `hasViewerAxes` 가 `eligibleOnly` 만 보는 것도 충분하다(로그인 사용자는 예외 없이 boolean). ② 초기화 둘(4.26)은 사양 표와 1:1 로 대응하고, 교차 단언 테스트가 섞임을 잡는다.

**받지 않은 제안 하나 — `slotCounts` 를 "한 번에 긁어 로컬 집계"로.** 조회 4회를 1회로 줄이자는 제안인데, 지금 구조는 `limit: 1` 4개라 **페이로드가 상수**다. 제안대로 바꾸면 호출은 줄지만 조건에 맞는 **전건을 받아와야** 하고, 리뷰도 "카탈로그가 커지면 손해로 뒤집힌다"고 적었다. 목 8건에서 유리한 쪽으로 갈아탄 뒤 데이터가 늘면 되돌려야 하므로 지금은 두고, **호출 수가 실제로 문제가 되는 P1-5b(구 25개)에서 서버 `facets` 와 함께 정한다** → 5장에 제안 내용을 옮겨 적었다.

검증: `tsc`·`eslint`·`vitest 202건`·`next build` 통과. 브라우저에서 시간대 칩을 눌러 **누른 칩만** `aria-busy=true`·`opacity 0.4` 가 되고 전환 후 복구되는 것을 확인했다. 순수 함수가 아니라 새 테스트는 없다(jsdom 미도입 → 4.10).

### 2026-09-05 · [#19](https://github.com/zzuub/MeetMap/issues/19)
**P1-5 · P1-5c — 필터 시트와 적용 필터 칩 줄**

P1-4 가 만든 URL 계약 위에 **쓰기 방향**을 얹었다. 시트만 만들면 닫는 순간 무슨 조건이 걸렸는지 안 보이므로 칩 줄을 같은 PR 에 넣었다.

- **`model/filterChips.ts`** — 칩 목록·개별 해제·초기화 두 종·활성 개수·필터 버튼 라벨. 칩은 주소가 아니라 **`(현재 조건) => 다음 조건` 함수**를 들고, 그 함수를 접으면 칩 줄의 `초기화` 가 된다. 미리 만든 주소를 들면 분위기처럼 한 축을 나눠 쓰는 칩들이 서로를 덮어 마지막 하나만 남는다
- **`ui/FilterSheet`** — 3층. 적용 버튼이 없다(6.4 실시간 반영) — 칩을 누르면 그 자리에서 URL 이 바뀌고 결과 수가 따라 움직인다. 드래프트 상태를 들지 않는다
- **`ui/AppliedFilterChips`** — 칩 전체가 해제 링크다. ✕ 만 누르게 하면 히트 영역이 44px 에 못 미치고 칩의 나머지가 죽은 자리가 된다. 접근 이름은 사양대로 `"{조건명} 필터 해제"`
- **`ui/ExploreFilterBar`** — 상단 컨트롤 조립. **URL 을 쓰는 유일한 클라이언트 자리**다
- **`exploreHref`** (`exploreParams.ts`) — `serializeExploreParams` 만 있으면 호출부마다 `/explore?` 를 손으로 붙이게 되고, 거기서 `URLSearchParams` 를 직접 만지는 경로가 열린다
- **`marksIneligible`** (`entities/event`) + `IneligibleBadge` — 리스트 카드의 `내 나이대 아님` (6.4·6.5)

**함정 3가지는 다음처럼 처리했다.**

| 함정 | 처리 |
| --- | --- |
| URL 을 손으로 조립 | 해제도 값을 바꿔 `exploreHref` 를 거친다. 자격 칩 ✕ 는 `eligibleOnly=0` 을 만든다 — 브라우저에서 `href="/explore?eligibleOnly=0"` 로 확인했고, 삭제로 바꾸는 변이가 테스트에 걸린다 |
| 게스트 게이트 우회 | 화면이 세션을 다시 보지 않는다. **키의 유무**를 읽는다(`hasViewerAxes`) → 4.27. 게스트로 `?eligibleOnly=1&maxPrice=30000` 을 손으로 붙여도 1층·가격 그룹·자격 칩이 전부 안 뜨는 것을 확인했다 |
| 필터 적용 순간의 로딩 | **눈으로 확인했고 표시를 넣었다.** `/explore` 는 동적 라우트인데 `loading.tsx` 가 없어(P1-9) 응답까지 화면이 그대로 선다. 표시를 **사용자가 보고 있는 자리**에 붙였다 — 칩은 `useLinkStatus` 로 누른 칩만 흐려지고(`prefetch={false}` 와 짝이다), 시트는 바가 가려져 안 보이므로 `N개 결과 보기` 가 흐려진다 |

**`초기화` 가 둘이고 대상이 다르다 → 4.26.** 칩 줄 쪽은 자격까지 끄고 시간대를 남기고, 시트 쪽은 자격을 남기고 시간대를 되돌린다. 6.2/6.4 를 각각 따른 결과라 이름을 갈라 두고 **차이 자체를 단언하는 테스트**를 붙였다.

**상단 시간대 칩 줄(6.2)을 앞당겨 넣었다.** 시트 2층에 시간대가 있는데 칩 줄은 시간대를 표시 대상에서 뺀다(상단 칩이 보여준다는 전제) — 상단 칩이 없으면 시트에서 고른 시간대가 닫는 순간 사라진다. 이 PR 이 없애려던 바로 그 상태다. 건수 0인 슬롯을 감추는 규칙 때문에 **`api/slotCounts.ts` 가 슬롯마다 `totalCount` 를 받아온다(조회 4회, 병렬)** — 목록 응답에 패싯 카운트가 없어서다 (5장).

**`내 나이대 아님` 은 화면에서 확인되지 않는다.** `viewer` 가 P2-4 까지 `null` 이라 배지가 뜨는 경로를 브라우저로 밟을 수 없다. 그래서 `marksIneligible` 로 규칙만 못 박고 순수 함수 수준에서 6가지를 검증했다 — 착수 노트가 예고한 그대로다.

검증: `tsc`·`eslint`·`vitest 202건`(신규 36건)·`next build` 통과. TZ 2종에서 같은 결과. 변이 12종 — 자격 칩 해제를 삭제로 / 게스트에게 자격 칩 노출 / `hasViewerAxes` 를 `maxPrice` 로 판정 / 시트 초기화가 자격까지 끄기 / 칩 줄 초기화가 시간대까지 되돌리기 / 분위기 칩 해제를 원본 기준으로 미리 계산 / `patched` 가 `undefined` 키를 남기기 / 활성 개수에 자격 포함 / 필터 버튼이 칩 줄과 무관하게 개수 붙이기 / 마지막 분위기 태그에 빈 배열 남기기 / 자격 필터가 켜져도 배지 그리기 / 게스트에게 배지 그리기 — **처음엔 10종만 잡히고 2종이 살아남았다.** 둘 다 직렬화가 걸러 줘서 URL 로는 티가 안 나는 것이라 조건 객체를 직접 보는 테스트를 더해 12종 전부 검출로 만들었다.

**남은 콘솔 오류 하나.** `/explore` 에서 400 이 여러 건 찍히는데 **P1-4 베이스라인에서도 같다**(stash 로 확인). 이번 변경과 무관해 건드리지 않았다 → 5장.

### 2026-09-05 · [#18](https://github.com/zzuub/MeetMap/issues/18) · [PR #21](https://github.com/zzuub/MeetMap/pull/21)
**코드리뷰 반영 — `area` 만 마스터 검증을 안 받고 있었다**

같은 PR 에서 6.1 에 "알 수 없는 값은 기본값으로 떨어뜨린다"를 적어 놓고, **`area` 축만 그 규칙에서 빠져 있었다.** `district`·`when`·`slot`·`scale`·`mood`·`maxPrice` 는 전부 `shared/config` 마스터를 거치는데 `area` 만 원문이 그대로 통과했다.

목 API 의 지역 필터가 `event.area !== query.area` 로 **정확히 일치**를 보기 때문에, `?area=오타` 하나로 전건이 걸러져 **조용한 빈 화면**이 된다. 6.1 이 금지한 바로 그 상황이고, `EventListQuery.area` 가 `string` 이라 타입도 잡아주지 않는다.

- `parseArea` 추가 — `AREAS` 에 있는 동만 통과. `parseDistrict` 와 같은 `find` 방식이라 타입 단언도 없다
- 테스트 2건 추가. 기존 테스트의 지역 리터럴(`"성수·건대"`)도 `AREAS[n]` 으로 바꿨다 — 마스터가 바뀌면 테스트가 같이 따라와야 한다

**리뷰가 확인해 준 것 둘.** ① `eligibleOnly` 3상태와 칩 ✕ 함정은 계약이 이미 막고 있다 — `serializeExploreParams` 가 `false` 일 때만 `=0` 을 쓰므로 P1-5c 가 그 경로를 타면 되살아나지 않는다. ② 게스트 게이트는 새는 곳이 없다 — `isGuest` 는 서버에서만 계산되고 호출부가 한 곳이며, 키 자체를 안 만들어서 `{ ...query }` 스프레드에도 실리지 않는다. ③ `더 보기` 의 `key` 전략은 `router.replace` 로 쿼리만 바뀌어도 유효하다(서버 재렌더 → key 갱신 → 재마운트).

세 가지 다 **P1-5 에서 우회하면 그대로 깨지는 것**이라 `phase1-notes` 의 P1-5 요점에 함정으로 적어뒀다.

검증: `tsc`·`eslint`·`vitest 166건`(신규 1건, 기존 보강 4곳)·`next build` 통과. `area` 검증을 리뷰 이전 상태로 되돌리는 변이로 테스트 2건이 실패하는 것을 확인했다.

### 2026-09-05 · [#18](https://github.com/zzuub/MeetMap/issues/18) · [PR #21](https://github.com/zzuub/MeetMap/pull/21)
**P1-4 — 탐색 리스트 `/explore` · 하단 탭 `지도` → `탐색`**

**하단 탭부터 고쳤다.** 홈의 `전체보기 >` 3개가 전부 `view=list` 로 보내는데 도착하면 `지도` 탭이 켜졌다 — 사용자가 지도를 누른 적도 없는데. 지도는 목적지가 아니라 **탐색을 보는 렌즈**이고 리스트/지도 전환은 이미 뷰 토글(6.2)의 몫이라, 탭을 `탐색`(`?view=list`)으로 바꾸고 아이콘(핀)은 남겼다. 지도 진입은 홈 프로모 카드와 뷰 토글 둘로 유지된다 → 기능정의서 5.5·1장.

- **`features/event-filter/model/exploreParams.ts`** — URL ↔ `EventListQuery` 변환. **URL 이 상태의 원본**(2.4)이라 이 함수가 탐색 화면의 계약이고, 순수 함수라 DOM 없이 테스트한다
- **`widgets/explore-board`** — 결과 수 + 리스트 + `더 보기`. 첫 페이지는 서버가 그리고 **이어붙이기만 클라이언트**가 한다(커서 그대로 사용). 상단 컨트롤은 그리지 않았다 — 눌러도 아무 일 없는 자리표시자는 홈의 옛 퀵 필터 칩과 같은 실수다
- **`view=map` 은 자리표시자**로 떨어뜨렸다. 지도는 P3-1 이라 지금 누르면 빈 화면이 정직하다

**사양에 없던 것 두 개를 정하고 6.1 에 적었다.**

1. **`eligibleOnly` 는 3상태다.** 로그인 기본이 ON 이라(6.4) "파라미터 부재 = 꺼짐"으로 읽으면 기본값을 표현할 수 없다. **부재 = 기본**, `=0` 이 명시적 OFF. 적용 필터 칩 줄(6.2)의 `내 나이대` ✕ 는 파라미터를 지우는 게 아니라 `=0` 을 쓴다 — 지우면 기본값으로 되살아난다
2. **알 수 없는 값은 기본값으로 떨어뜨린다.** URL 은 손으로 고칠 수 있고 공유도 된다. `maxPrice` 는 `PRICE_CAPS` 에 있는 값만 받는다 — 임의 숫자를 받으면 필터 시트가 아무 칩도 선택 못 한 상태로 뜬다

**페이지네이션은 TanStack Query 없이 간다.** 실 API 가 없어 캐시·무효화 정책을 지금 짜면 서버가 붙을 때 다시 짠다. 무한 스크롤도 아직 TBD(16장)라 `더 보기` 버튼으로 두고, 도입 판단은 **P2-7 찜 낙관적 업데이트**에서 한다 — 클라이언트 상태가 실제로 필요해지는 지점이다.

검증: `tsc`·`eslint`·`vitest 165건`(신규 12건)·`next build` 통과. 브라우저에서 게스트·로그인 두 상태로 확인했다 — 전체 8건 / `slot=DINNER` 5건 / **`slot=BRUNCH`(오타) 8건으로 폴백** / `district=MAPO` 1건 / `status=OPEN` 7건 / 게스트는 `eligibleOnly=1` 을 무시하고 8건 / 로그인 기본 6건 · `=0` 8건 · `=1` 6건. `더 보기` 는 6→8건으로 **중복 없이** 이어지고 마지막 페이지에서 버튼이 사라진다. 빈 상태(`district=GANGBUK`)와 `view=map` 자리표시자도 확인했다.

### 2026-09-04 · [#17](https://github.com/zzuub/MeetMap/issues/17) · [PR #18](https://github.com/zzuub/MeetMap/pull/18)
**코드리뷰 반영 — "모집 중만"이 계약이 아니라 목 구현 안에만 있었다**

리뷰가 짚은 것은 판정 로직 중복이 아니라(그건 `isOpen` 한 곳이다) **규칙이 계약에 없다는 것**이었다. `HomeFeed` 타입·`EventApi` 독스트링·기능정의서 13장 어디에도 "모집 중만"이 없어서, 실 API 로 전환한 뒤 서버가 마감 건을 섞어 내려도 **인지할 자리가 없었다.** 홈은 상태 배지를 뺀 화면이라 눈으로도 안 보인다.

- **계약 명시 3곳** — `EventApi.getHomeFeed` · `HomeFeed` 독스트링 · 기능정의서 13장 홈 행
- **`openSectionsOnly`** (`api/eventApi.ts`) — 실 API 응답에 같은 `isOpen` 을 한 번 더 태운다. 목은 쓰지 않는다(거기서는 **자르기 전에** 걸러야 섹션이 6건을 채운다). 잘못 보여주는 것보다 덜 보여주는 쪽을 골랐다 → 4.23
- **`HOME_SECTION_KEYS`** — 섹션 키를 `model/types.ts` 한곳에 모으고 `HomeFeed` 가 이를 `extends` 한다. 섹션이 늘면 **타입이 새 필드를 요구**하고, 방어 필터(키 순회)·화면 표(`widgets/home-feed`)·테스트가 함께 걸린다. 위젯이 갖고 있던 같은 유니온은 지웠다

**받지 않은 제안 하나 — `resolveViewer(session)` 헬퍼.** 사용처가 아직 하나라 지금 만들면 항상 `null` 을 반환하는 껍데기다. 더 중요한 건 **둘 자리가 정해지지 않았다는 것**이다 — `entities/account` 는 `EventCardViewer` 를 참조할 수 없다(동일 레이어). 두 번째 사용처인 P1-4 에서 타입 배치와 함께 정한다 → 5장.

**접근성 3건은 유지한다.** 캐러셀 `tabIndex`(스크롤 영역 패턴에 부합, 스크린리더에 정지점 하나 추가는 감수), `ul aria-label`(제목과 다른 노드라 중복 아님), 프로모 카드의 stretched link + 칩 `z-10`(탭 순서는 z-index 가 아니라 DOM 순서라 시각 순서와 일치) — 리뷰도 전부 블로킹 아님으로 봤다.

검증: `tsc`·`eslint`·`vitest 153건`(신규 5건)·`next build` 통과. 변이 3종 — 방어 필터가 첫 섹션만 거르기 / 입력 객체 그대로 변형 / 섹션 표에서 한 줄 누락 — 전부 실패를 확인했다. **`httpEventApi` 가 이 함수를 실제로 부르는지는 테스트가 없다** — fetch 목이 없어서다. 순수 함수만 덮었다.

### 2026-09-04 · [#17](https://github.com/zzuub/MeetMap/issues/17)
**P1-3 — 홈 `/`**

자리표시자였던 홈을 실제 화면으로 바꿨다. `widgets/home-feed` 가 처음 생긴 화면 블록이다.

- **`widgets/home-feed/`** — `HomeHero`(헤드라인 + 추천 기준 문구) · `MapPromoCard`(지도 진입 + 지역 바로가기 칩) · `EventSection`(제목 + `전체보기 >` + 카드 목록)
- **`widgets/app-header/HomeHeader`** — 로고·검색·알림. 스택 화면의 `AppHeader`(뒤로가기·타이틀)와 성격이 달라 컴포넌트를 나눴다. 로고는 이동이 아니라 **맨 위로 되돌리기**다(5-1)
- **섹션 규칙을 `model/sections.ts` 로 뺐다** — 순서·카드 변형·`전체보기 >` 프리셋이 표 하나에 모인다. 게스트면 섹션 B 를 빼고, 건수 0인 섹션은 그리지 않는다. **DOM 없이 테스트된다**(jsdom 을 붙이지 않은 이유가 여기서도 유지된다 → 4.10)
- **지역 바로가기 칩은 피드에서 뽑는다** — 25개 구 중 넷을 상수로 박으면 결과 0건인 바로가기가 생긴다. 건수 0인 칩을 노출하지 않는 6.2/6.3 원칙과 같다
- **`currentTimeSlot` 신설** — 추천 기준 문구의 `{시간대}`. `weekRangeKst` 와 같은 이유로 **실행 환경 타임존을 읽지 않는다**(서버 렌더라 특히)
- **가로 스크롤 캐러셀에 `tabIndex`** — 스크롤 컨테이너가 포커스를 못 받으면 키보드만 쓰는 사용자가 옆 카드를 볼 수 없다 (5-10)

**홈은 마감을 아예 거른다 → 4.23.** `getHomeFeed` 세 섹션 전부 모집 중만이고, 그래서 `feature` 카드의 **상태 배지를 뺐다.** 5.3 표시 항목도 함께 고쳤다. `ratio`·`compact` 에 배지를 늘리는 대안 대신 이쪽을 택한 것은 **홈에 상태 필터가 없어 마감 건을 걷어낼 수단이 없기** 때문이다(5.4의 뒷면). `compact` 는 찜 목록과 공용이라 손대지 않았다 — 거기서는 배지가 필요하고(9장), P2-8 의 몫이다.

**남긴 것 3가지** (5장에 올렸다): 찜 버튼(P2-7 `features/event-like`), 알림 안읽음 도트(P4), **카드 `viewer` 주입**(P2-4). 세 번째가 눈에 보인다 — 목 세션에 출생연도·성별이 없어 로그인 상태에서도 가격이 남·여 병기로 나오고, 섹션 B 배지가 `{N}년생` 대신 모집 범위(`95~02년생 참가 가능`)로 떨어진다. Phase 1 DoD 는 게스트 경로라 막히지 않는다.

검증: `tsc`·`eslint`·`vitest 148건`(신규 13건)·`next build` 통과. TZ 3종(로컬/`America/Los_Angeles`/`Pacific/Kiritimati`)에서 같은 결과. 변이 8종 — 홈 피드 마감 필터 제거 / 시간대 경계 `<`→`<=` / KST 보정 제거 / 게스트에게 섹션 B 노출 / 빈 섹션 렌더 / 바로가기 상한 제거 / 중복 구 접기 제거 / 섹션 순서 뒤집기 — 중 **7종이 실패했고 1종(중복 구)이 통과했다.** 그 한 줄은 `Map` 이 이미 하는 일이라 죽은 코드였고, 지웠다. 브라우저에서 게스트·로그인 두 상태와 마감 건 제외를 확인했다.

### 2026-09-03 · [#12](https://github.com/zzuub/MeetMap/issues/12)
**코드리뷰 반영 — 테스트 갭 2건과 목 데이터 중복 가드**

- **`sort=latest` 가 `applySort` 경로로 한 번도 테스트되지 않았다.** `getHomeFeed` 의 `newlyAdded`(`byCreatedAtDesc` 직접 호출)만 덮고 있어서 정렬 분기는 비어 있었다. 가격 정렬과 같은 패턴으로 추가했다
- **목 주최사 수치 중복에 실제 가드를 붙였다** — `src/app/_consistency/providerRating.test.ts`. 레이어 경계 규칙이 `app` 을 대상에서 빼고 있다는 점을 이용해 두 entity 의 **공개 API** 로 교차 검증한다 → 4.21
- **`정렬 축에 동률이 없다` 불변식 추가** — 동률이 생기면 `Array.sort` 안정성만으로 정렬 테스트가 통과해 비교 함수 버그를 못 잡는다. `sort=rating` 이 실제로 그랬다. 이제 목 데이터에 동률이 들어오는 순간 테스트가 알려준다
- **`EventProviderRef`/`EventProviderDetail` 에 상호 `@see` 링크** — 필드명이 같고 타입만 다른 대응 관계를 JSDoc 이 설명한다

**리뷰가 확인해 준 것**: 카드가 `EventSummary` 만 받고 `EventProviderRef` 에 `rating` 이 없어 **"카드에 평점 없음"을 타입 체커가 강제**하고 있다. 코드베이스 어디서도 `.provider.rating` 을 읽지 않는다. 4.21 의 3가지 대안 비교도 실제 ESLint 제약 위에 서 있음이 확인됐고, 네 번째 대안(FSD 교차 참조 `@x`)을 4.21 에 기록했다.

**남긴 리스크**: 지금은 가격·등록시각에 동률이 없어 안전하지만, 목을 늘리다 가격이 겹치면 `priceAsc`/`priceDesc` 도 같은 이유로 조용히 무의미해진다. 위 불변식 테스트가 그 시점을 알려주고, 그때 `rating` 에서 쓴 **뒤집어 넣기**를 적용하면 된다.

검증: `tsc`·`eslint`·`vitest 135건`(9파일) 통과. 교차 검증 테스트는 변이 4종(후기 수·평점·**임계 미만 주최사 평균**·주최사 이름)으로 전부 검출을 확인했다.

### 2026-09-02 · [#12](https://github.com/zzuub/MeetMap/issues/12)
**P1-2c — 코드 품질 정리 (동작 변경 없음)**

"실무 기준으로 봐도 괜찮은 코드인가"를 실제로 재보고 미달인 곳을 고쳤다. 기능은 하나도 바뀌지 않았다.

| 지적 | 전 | 후 |
| --- | --- | --- |
| `EventCard` 한 함수가 4개 레이아웃을 겸함 | **함수 202줄** | **20줄** + 레이아웃 5파일 (4.22) |
| 주석 과잉 | `rating.ts` 65% · `types.ts` 58% | 전체 28% (기존 P0 컨벤션 12~24%) |
| 테스트가 목 데이터 id 에 결합 | 하드코딩 단언 **25곳** | **0곳** — 성질 단언으로 교체 |
| `DesignSystemPreview` 비대 | 664줄 / 함수 486줄 | 8파일 최대 209줄 / 함수 184줄 |

- **`EventCard/` 디렉터리로 분리** — `index.tsx`(변형→레이아웃 표) + 레이아웃 5개 + `parts.tsx`(공용 조각) + `types.ts`. 변형 추가가 **파일 하나 + 표 한 줄**이 된다 → 4.22
- **테스트를 성질 단언으로** — `expect(ids({district:"MAPO"})).toEqual(["evt-003"])` 처럼 id 를 나열하면 목 데이터 한 줄만 고쳐도 무관한 테스트가 깨진다. `expectFilterMatches(query, predicate)` 헬퍼가 "남은 건이 전부 조건을 만족하고, 만족하는 건이 하나도 안 빠졌는지"를 양방향으로 본다
- **중복 테스트 2건 삭제** — 보정식 성질(표본 적은 만점이 지는 것·후기 0건이 중간에 놓이는 것)은 `shared/lib/rating.test.ts` 와 `entities/provider` 목 테스트가 이미 덮는다. 이벤트 쪽은 **정렬 키가 `ratingScore` 라는 계약**만 본다
- **주석 압축** — 근거·대안은 `decisions.md` 가 원본이므로 소스에는 참조만 남겼다. `rating.ts` 의 보정 표는 4.20 으로 넘겼다

**느슨해진 테스트가 여전히 버그를 잡는지 변이 11종으로 확인했다** — 필터 6축 무력화 / 인기순 역전 / 평점정렬→인기순 / 2차 정렬 제거 / `providerId` 제거 / 검색 주최사명 제외. 전부 실패했고, `scale`·`status`·`maxPrice` 는 오히려 **전보다 더 많은 테스트가 깨졌다**(양방향 검사라서).

검증: `tsc`·`eslint`·`vitest 130건`·`next build` 통과. 브라우저에서 카드 26장·섹션 12개·stretched link 히트 영역이 리팩터 전과 동일함을 확인했다.

### 2026-09-02 · [#12](https://github.com/zzuub/MeetMap/issues/12)
**P1-0b · P1-2b — `provider` 객체 승격과 회차 평점 삭제**

앞선 문서 커밋이 정의한 모델을 `src/` 에 옮겼다. 문서가 코드보다 앞서 있던 간극이 닫혔다.

- **`entities/provider/` 신설** — `ProviderSummary`/`ProviderDetail`, `ProviderApi` 포트, mock/http 구현, 목 주최사 4곳
- **`EventSummary.provider: string` → `EventProviderRef({ id, name })`**. `EventDetail.provider` 는 `EventProviderDetail`(+`tagline`·`rating`·`reviewCount`) 이다. 상세의 주최사 블록(7.1)을 그리려고 왕복을 한 번 더 돌지 않는다
- **`rating`·`reviewCount` 삭제** — 회차 평점은 성립하지 않는 값이다 (4.19)
- **`EventListQuery.providerId` 신설** — 주최사 페이지의 `진행 중인 소개팅` 이 `{ providerId, status: 'OPEN' }` 으로 가져간다
- **`sort=rating` 목 구현** — 정렬 키는 주최사 `ratingScore`, 2차 정렬은 개최일 가까운 순
- **`shared/lib/rating.ts` 신설** — 평점 산식을 `entities` 가 아니라 `shared` 에 뒀다 (4.21)
- **`Review.providerId` 추가**, `ReviewDraftTarget.provider` 를 객체로 · `thumbnailUrl` nullable
- **`ENDPOINTS.provider`** — `/providers/{id}`, `/providers/{id}/reviews`

**목 데이터를 주최사 4곳 × 회차 2건으로 재구성했다.** 이전에는 8건에 주최사가 7곳이라(2건은 `로테이션서울` 하나뿐) 주최사 단위 집계를 화면에서 검증할 수 없었다 — 평점 요약도 `진행 중인 소개팅` 목록도 늘 1건짜리가 된다. 기존 경계값(가격 `null`·마감·정밀도 3종·규모 3종·시간대 4종·일정 5:3·가격 상한 3종)은 **회차 내용을 건드리지 않고 주최사만 재배정**해 전부 보존했다. 주최사 쪽 경계는 새로 넣었다 — 평점 표시(47건·12건) / **표시 임계 미달**(3건) / **후기 0건**(신규 입점) / 모집 중인 회차 1건(나머지는 마감).

**직접 고친 것 하나** — `evt-008` 의 썸네일도 `null` 로 내렸다. **이미지 사용 동의는 회차가 아니라 주최사 단위**인데(7.2), P1-1 에서는 주최사 개념이 없어 `evt-006` 한 건만 비워 뒀었다. 같은 주최사인데 회차마다 동의 범위가 다른 셈이라 모순이었다. 목 API 테스트가 이 불변식을 지킨다.

**문서 정정 1건** — 12장의 `ProviderDetail` 에 `openEvents`·`recentReviews`·`reviewSummary` 를 넣어 뒀는데 **FSD 위반**이었다(`entities/provider` 는 `entities/event`·`entities/review` 를 import 할 수 없다). 세 조각을 상위 레이어에서 조립하는 형태로 고쳤다. 서버는 한 번에 내려도 되고, 나뉘는 것은 프론트의 타입 경계다.

검증: `tsc`·`eslint`·`vitest 132건`(신규 25건) 통과. 변이 6종 — 정렬에 보정 대신 원본 평균 / 표시 임계 `이상`→`초과` / 미달 시 `null`→`0` / 평점 정렬 2차 정렬 제거 / `providerId` 필터 제거 / `evt-008` 썸네일 되살리기 — 전부 실패를 확인했다.

> **2차 정렬 테스트를 한 번 다시 짰다.** 처음 쓴 테스트는 변이를 잡지 못했다 — 목 데이터가 이미 개최일 순으로 적혀 있어 `Array.sort` 의 안정성만으로 통과했기 때문이다. `applySort` 를 내보내 **뒤집은 배열**로 검증하도록 고치니 그제야 잡혔다. 통과하는 테스트를 믿지 않는다는 관행이 실제로 값을 한 사례다.

### 2026-09-02 · 이슈 · PR 번호 미정
**평점 귀속 재정의 — 후기는 회차가 아니라 주최사에 쌓인다 (문서만)**

`src/` 변경은 없다. P1-0b 착수 전에 **문서를 먼저 맞춘 것**이다.

발단은 P1-1 리뷰에서 나온 관찰이었다 — "카드 5종 어디에도 평점이 없다"(5.3·6.5·7.1 표시 항목에 없음). 표시 항목 누락인지 확인하려다 **회차 평점 자체가 성립하지 않는 값**이라는 게 드러났다 → 4.19.

- **기능정의서 7.4 신설** — 주최사 소개 페이지 `/providers/[providerId]`. 근거·화면 구성·평점 표시 임계(5건)·후기 귀속 규칙
- **12장** — `EventSummary.rating`·`reviewCount` 삭제, `provider: string` → `{ id, name }`, `ProviderSummary`/`ProviderDetail` 신설, `Review.providerId` 추가
- **6.1·6.2** — `sort=rating` 추가 + 베이지안 보정 정렬 규칙 (4.20)
- **8장** — 비교표 `후기` 행 → `주최사 평점`, 5건 미만 주최사는 `후기 좋음` 배지 후보 제외
- **10.4** — 후기 목록 라우트 분리 **TBD 해소**. `/providers/[id]/reviews` + `/my/reviews`, 회차별 후기 목록은 만들지 않는다
- **10.5** — 정책 고지에 `"작성한 후기는 주최사 소개 페이지에 공개됩니다."` 추가
- **1·13·14·16·17장** — 라우트·API·FSD 매핑·미해결·우선순위 반영
- **dev-plan** — P1-0b·P1-2b·P5-4·P5-5 추가, blocking #14(평점 산식 상수)·#15(`tagline` 출처) 추가
- **정리** — 1.2 화면 전이도에 남아 있던 `퀵칩` 경로 제거(5.4 에서 이미 삭제된 것)

**보류한 것 — 홈 `신규 입점 주최사` 섹션.** 평점순이 기존 주최사에 유리하니 신규에게 균형추를 달자는 제안이 있었다. 지금은 넣지 않는다 → 5장.
### 2026-09-02 · [#11](https://github.com/zzuub/MeetMap/issues/11) → [PR #12](https://github.com/zzuub/MeetMap/pull/12)
**P1-1 · P1-2 — `EventCard` variant 5종과 그 조각들**

카드 없이 배지만 있으면 리뷰할 게 없고, 배지 없는 카드는 반쪽이라 **두 작업을 한 PR 로 닫았다.**

- **`model/labels.ts` 신설** — 표기 규칙을 순수 함수로 모았다. `birthYearLabel`·`birthYearRangeLabel`·`capacityLabel`·`priceDisplay`·`locationLabel`·`providerScheduleLabel`·`providerSlotLabel`·`timeSlotLabel`·`scaleLabel`. `derive.ts` 가 도메인 판정을 맡고 이쪽이 표기를 맡는다. **문자열만 만들고 세리프 래핑은 컴포넌트가 한다** — 같은 문자열이 `aria-label`·지도 마커처럼 JSX 아닌 자리에도 쓰인다
- **`ui/` 신설** — `EventCard`(variant 5종) + 조각 6종 `EventStatusBadge`(2종) `TimeSlotBadge`(4종) `CapacityText` `PriceText` `BirthYearRangeText` `EventThumbnail`
- **카드 전체 링크를 stretched link 로 만들었다** (4.16). 찜·신청 버튼은 `action` 슬롯으로 비웠다 — `entities` 는 `features` 를 모른다
- **조각의 타이포를 부모에 위임했다** (4.17) — `cn()` 이 Tailwind 충돌을 해결하지 못하는 제약 위에서 재사용 가능하게 만드는 유일한 방법이다
- **`thumbnailUrl` 을 nullable 로 바꿨다** (4.18) — 이미지 사용 동의를 받지 못한 주최사가 실재한다. 기능정의서 12장도 함께 갱신했다. 목 `evt-006` 이 이 경계값을 든다
- **`/design-system` 에 3개 섹션 추가** — variant 5종 / 조각 6종(P1-2 DoD) / 경계값 4건(가격 `null`·이미지 미동의·마감·후기 0건)을 5 variant 로 교차 렌더

**표시 항목은 5.3·6.5·6.6 을 그대로 따랐다.** 그 결과 두 가지가 드러났다.

- **`ratio`·`compact` 에는 모집 상태가 없다.** 5.3 섹션 B·C 표시 항목에 상태가 없어서인데, 홈 `내 나이대` 에 마감된 소개팅이 뜨면 신청 가능해 보인다. `evt-007` 은 인기 2위라 실제로 뜬다. **표시 항목을 늘리려면 기능정의서를 고쳐야 해서 임의로 넣지 않았다** — 5장 미해결로 올렸다
- **평점·후기 수는 어느 카드에도 없다.** 5.3·6.5·7.1 어느 표시 항목에도 없다. 후기는 비교함(8장)과 후기 목록(10.4)의 축이다. 그래서 `RatingText` 를 만들지 않았다

**UI 규칙 감사** — `div + onClick` 0건(`Sheet`·`Modal` 딤도 `<button aria-label="닫기">`), `--color-accent` 위 흰 텍스트 0건, 가격·정원만 세리프이고 날짜·시각·출생연도는 산세리프임을 브라우저 실측으로 확인. 터치 타깃 44×44 미달 3건(`Chip` 38 / `SegmentedControl` 36 / `Toggle` 30)은 **P0-3 잔존 항목**이라 이 PR 범위 밖으로 두고 부채에 올렸다.

검증: `tsc`·`eslint`·`vitest 107건`(신규 22건) 통과. `TZ=America/Los_Angeles`·`Pacific/Kiritimati` 재실행 통과, `next build` 통과. 신규 22건은 변이 5종(두 자리 패딩 제거, 게스트 병기→남성값, 역명 `null` 폴백 제거, 동일 연도 단축 제거, 내 성별 미확인→0원)으로 전부 실패를 확인했다.

### 2026-09-02 · 이슈 · PR 번호 미정
**P1-0 — 로테이션 소개팅 데이터 모델을 코드에 반영**

4.6 의 도메인 재정의는 문서에만 있었다. `src/` 를 기능정의서 12장 확정본에 맞췄다.

- **타입 교체** — `EventSummary`/`EventDetail`: `category`·`remainingSeats`·`femaleRatio`·`minAge`/`maxAge`·`applyDeadline`·`genderPolicy` 삭제, `birthYearFrom`/`To`·`maleCapacity`/`femaleCapacity`·`scale`·`malePrice`/`femalePrice`(nullable)·`locationPrecision`·`jobGroups`·`createdAt`·`venueName`/`address`/`attendeeListUrl` 신설. `TimeSlot` 3→4종, `EventStatus` 3→2종
- **상수** — `CATEGORIES`·`MAX_INTEREST_CATEGORIES`·`GENDER_FILTERS`·`ONLY_20S_MAX_AGE`·`DEADLINE_ALERT_SEAT_THRESHOLD` 삭제. `WHEN_OPTIONS`·`SCALE_OPTIONS`·`PRICE_CAPS`·`JOB_GROUPS` 신설
- **필터 축 교체** — `only20s`·`gender` → `when`·`scale`·`status`·`maxPrice`·`eligibleOnly` (6.1 URL 설계와 1:1)
- **홈 3섹션 교체** — `popular`/`femaleFriendly`/`openNow` → `weeklyPopular`/`myAgeGroup`/`newlyAdded` (5.3)
- **목 8건 전면 교체** — 취미 모임(러닝 크루·쿠킹 클래스·전시 도슨트) → 로테이션 소개팅. 경계값을 일부러 섞었다: 가격 `null` 1건 / 후기 0건 1건 / `마감` 1건(인기 2위라 홈 첫 화면에 뜬다) / `locationPrecision` 3종 / `scale` 3종 / `timeSlot` 4종 / 이번 주 5건·그 이후 3건
- **`model/derive.ts` 신설** — `deriveScale` `isThisWeek`/`weekRangeKst` `priceFor` `isEligible`. 서버가 인증 주체로 해석할 규칙(6.1)을 한곳에 모아 목과 실서버가 다르게 걸러지는 것을 막는다
- **`mock/viewer.ts` 신설** — `eligibleOnly`·`maxPrice`·가격 정렬은 쿼리에 성별·출생연도를 싣지 않으므로(13장), 백엔드가 없는 동안 `MOCK_VIEWER`(1996년생·여)가 인증 주체 자리를 대신한다
- **타 entity** — `UserProfile.interestCategories` / `NotificationSettings.deadlineAlert` / `NotificationKind.urgent` 삭제

**12장을 넘어선 판단 3건** — `stationName` 추가(4.13), 남녀 동수 전제(4.14), 직업군 자유 입력(4.15).

**되돌리기 쉬운 기본값 2건** — `sort=latest` 를 `createdAt` 기준으로 정의했다(개최일 임박순이 아니다. 홈 `새로 등록된` 과 같은 축). `maxPrice` 는 가격 미확인 건을 **제외**한다 — `3만원 이하`를 건 사용자에게 가격을 모르는 건을 섞으면 필터가 거짓말이 된다.

**정리** — `--color-warning` 토큰 주석에서 `마감임박 배지` 용도 제거(상태 2종이 되며 미사용), 디자인시스템 토글 데모 라벨을 살아 있는 설정으로 교체, `src/README.md` 의 마스터 데이터 예시를 `CATEGORIES` → `AREAS` 로.

검증: `tsc`·`eslint`·`vitest 82건` 통과(신규 35건). 변이 테스트 15종 전부 실패 확인 — 규모 경계 4종, KST 오프셋 제거, 주 하한 제거, 정원 검사 제거, 성별 분기 제거, 가격 `null` 통과, mood OR→AND, 정렬 역전 2종, `status=OPEN` 제거, 목 데이터 동수 전제 위반.

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
