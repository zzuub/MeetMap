# 작업 이력 — 보관

Phase 0 과 Phase 1 초기(#11 이전) 이력이다. 현재 작업에는 필요 없다.
최근 이력은 [progress.md](progress.md) 3장에 있다.

---

## 3. 작업 이력 (보관분)

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
