> 기능정의서 · 14장 FSD 컴포넌트 매핑
> 상위 [00-index.md](00-index.md) · 공통 전제 [02-공통규칙.md](02-공통규칙.md) · 타입 [10-데이터모델.md](10-데이터모델.md)

---

## 14. FSD 컴포넌트 매핑

```
app/
  (onboarding)/onboarding/page.tsx              # 로그인
  (onboarding)/onboarding/terms/page.tsx
  (onboarding)/onboarding/intro/page.tsx
  (onboarding)/onboarding/profile/page.tsx
  (onboarding)/onboarding/done/page.tsx
  (onboarding)/onboarding/location/page.tsx
  (main)/layout.tsx                             # BottomNav 셸
  (main)/page.tsx                               # 홈
  (main)/explore/page.tsx
  (main)/likes/page.tsx
  (main)/my/page.tsx
  (stack)/layout.tsx                            # AppHeader 셸
  (stack)/events/[eventId]/page.tsx
  (stack)/providers/[providerId]/page.tsx       # 주최사 소개 (7.4)
  (stack)/providers/[providerId]/reviews/page.tsx
  (stack)/compare/page.tsx
  (stack)/search/page.tsx
  (stack)/my/notifications/page.tsx
  (stack)/my/notifications/settings/page.tsx
  (stack)/my/reviews/page.tsx
  (stack)/reviews/write/[eventId]/page.tsx
  error.tsx / not-found.tsx / loading.tsx
  _consistency/                                 # entity 간 목 데이터 교차 검증 (라우트 아님)
                                                # 레이어 경계 규칙이 app 을 빼고 있어 두
                                                # entity 를 함께 볼 수 있는 유일한 자리다

widgets/
  app-header/            HomeHeader (홈: 로고·검색·알림) / AppHeader (스택: 뒤로가기·타이틀·액션)
  bottom-nav/            BottomNav
  home-feed/             HomeFeed (헤드라인 + 지도카드 + 3개 섹션 조립. 퀵 필터 칩 바 없음 — 5.4)
                         HomeHero · MapPromoCard · EventSection + model/sections(섹션 표·지역 바로가기)
  explore-board/         ExploreBoard (결과 수 + 리스트) · EventList(`더 보기` — 첫 페이지는
                         서버, 이어붙이기는 클라이언트). 컨트롤바는 P1-5·P1-6 이 붙는다
  event-detail/          EventDetailView (히어로 + 정보카드 + 주최사 블록 + 고정 CTA)
  provider-profile/      ProviderProfileView (프로필 + 평점 요약 + 모집 중인 회차
                         + 최근 후기 3건. 7.4)
  compare-board/         CompareBoard (컬럼 헤더 + 비교표)
  my-summary/            MySummary (프로필 카드 + 완성도 + 카운터 + 메뉴)
  review-board/          ReviewBoard (평점 요약 + 필터 + 후기 리스트)

features/
  event-filter/          **exploreParams(URL ↔ EventListQuery 변환 — 6.1 계약. P1-4 구현)**
  auth-social-login/     SocialLoginButtons, useSocialLogin
  terms-agreement/       TermsAgreementForm, useTermsAgreement
  profile-setup/         ProfileSetupForm, useProfileSetup
  location-permission/   LocationPermissionGate, useGeolocation, AreaSelector
  event-filter/          TimeSlotChipBar(6.2 상단 시간대 칩), AppliedFilterChips(6.2 적용 필터
                         칩 줄 — 조건 0개면 미렌더), FilterSheet(6.4 3층), DistrictSheet(6.3),
                         useEventFilter (URL 동기화)
  event-sort/            SortSelect, ViewToggle
  event-like/            LikeButton, useLikeEvent, likeEventApi
  event-compare/         CompareBar, CompareTable, useCompareStore (localStorage)
  event-apply/           ApplyButton, ExternalApplyModal, logOutboundClick
  event-map/             EventMap, EventMarker, MarkerSheet
  event-search/          SearchInput, RecentKeywords, TrendingKeywords, useSearch
  notification-inbox/    NotificationList, NotificationFilter, useMarkRead
  notification-settings/ SettingToggleList, QuietHoursSelector
  review-write/          ReviewForm, StarRating, ReviewTagPicker, useReviewDraft

entities/
  event/
    ui/EventCard/        index(변형→레이아웃 표) + FeatureCard·RatioCard·CompactCard·
                         ListCard·SheetCard + parts(CardTitle·CardPrice·EligibilityBadge)
                         ⚠️ 변형 추가는 **파일 하나 + 표 한 줄**이다. 한 함수에서 분기하지
                         않는다 (decisions.md 4.22)
    ui/                  EventStatusBadge(2종), TimeSlotBadge(4종), CapacityText(`남 N · 여 N`),
                         PriceText(성별 기준값), BirthYearRangeText,
                         EventThumbnail(이미지 미동의·로드실패 대체 표시)
    model/               types, derive(deriveScale·isEligible·priceFor·isThisWeek·isOpen·
                         currentTimeSlot),
                         labels(표기 규칙), ports
    api/ · mock/         eventApi(목/실 분기), 목 8건 + MOCK_VIEWER
                         ⚠️ FemaleRatioBar 는 만들지 않는다 — 정원이 남녀 동수라 성비가 항상 50%다
                         ⚠️ 카드에 평점을 그리지 않는다 — 회차 평점은 존재하지 않는 값이다 (7.4)
  provider/              types(ProviderSummary·ProviderDetail), ports, providerApi, 목 4곳
                         **미구현(P5-4)**: ProviderCard, ProviderRatingText(`4.6 (23)` /
                         5건 미만은 `후기 N건`)
                         ⚠️ entities 끼리는 서로 import 하지 않는다. event 가 쓰는 주최사 최소
                         형태(`EventProviderRef`)는 event 슬라이스가 직접 정의한다
  user/                  ProfileCard, CompletionMeter, types, userApi
  notification/          NotificationCard, types, notificationApi
  review/                ReviewCard, RatingDistribution, ReviewTagChip, types, reviewApi

shared/
  ui/                    Chip, TagChip, SegmentedControl, Toggle, Sheet, Modal, Toast,
                         IconButton, PrimaryButton, EmptyState, ErrorState, Skeleton,
                         Numeric(세리프 숫자), Checkbox, StarInput
  lib/                   formatPrice, formatEventDate, formatRelativeTime, cn,
                         highlightKeyword, clampSelection,
                         rating(ratingScore·canShowRating — 주최사 규칙이지만 event 의 정렬도
                         같은 산식을 써야 해서 shared 에 둔다. decisions.md 4.21)
  api/                   fetchClient (baseURL · 에러 정규화 · 인증 헤더)
  config/                theme.ts, constants.ts (AREAS, PROVINCES/SEOUL_DISTRICTS, TIME_SLOTS,
                         WHEN_OPTIONS, SCALE_OPTIONS, PRICE_CAPS, MOOD_TAGS, JOB_GROUPS, REVIEW_TAGS)
```

### 14.1 카드 컴포넌트 변형

`EventCard`는 5가지 변형이 필요하다. `variant` prop으로 통합한다.

| variant | 사용처 | 크기 |
| --- | --- | --- |
| `feature` | 홈 가로 스크롤 섹션 | 196px 폭, 썸네일 118px |
| `ratio` | 홈 "내 나이대 소개팅" | 196px + 정원(`남 N · 여 N`) 표기 |
| `compact` | 홈 "새로 등록된 소개팅", 찜 목록 | 썸네일 62~66px 가로형 |
| `list` | 탐색 리스트, 검색 결과 | 썸네일 84~92px 가로형 |
| `sheet` | 지도 마커 시트 | 썸네일 88px |
