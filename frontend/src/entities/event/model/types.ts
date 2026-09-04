import type { DistrictCode, ProvinceCode } from "@/shared/config";

/** 근거: docs/spec/10-데이터모델.md (12장) (2026-09-01 도메인 재정의 확정본) */

/** 시간대. 경계는 **시작 시각** 기준이다 — 12:00 시작은 오후, 21:00 시작은 심야 (6.2) */
export type TimeSlot = "MORNING" | "AFTERNOON" | "DINNER" | "LATE_NIGHT";
export type TimeSlotFilter = TimeSlot | "ALL";

/** 선착순이 아니라 주최사 심사 선발이라 `잔여 좌석`·`마감임박` 이 없다 (4.6) */
export type EventStatus = "신청 가능" | "마감";

/** 정원 합계 기준 파생값 (6.4). `deriveScale` 로 산출한다 */
export type EventScale = "SMALL" | "STANDARD" | "LARGE";
export type ScaleFilter = EventScale | "ALL";

/** 정확한 주소가 없는 건이 많다. 동 → 역 → 구 순으로 핀을 내린다 (6.6) */
export type LocationPrecision = "EXACT" | "STATION" | "DISTRICT";

/** 일정 필터 (6.4 2층) */
export type WhenFilter = "ALL" | "THIS_WEEK" | "LATER";

/** 모집 상태 필터 (6.4 3층). `OPEN` 이면 `status === '신청 가능'` 만 */
export type StatusFilter = "ALL" | "OPEN";

export type SortOption =
  | "popular"
  | "latest"
  | "rating"
  | "priceAsc"
  | "priceDesc";

/**
 * **`EventSummary.provider` 의 타입.** 목록이 나르는 주최사 최소 형태다.
 * `entities/provider` 를 import 할 수 없어 여기서 정의한다(FSD 동일 레이어 금지).
 *
 * ⚠️ 평점을 넣지 않는다 — 카드 5종 어디에도 주최사 평점을 그리지 않는다 (7.4).
 * 그래서 `EventSummary` 만 받는 카드에서는 `.provider.rating` 이 **타입 에러**다.
 *
 * @see EventProviderDetail — `EventDetail` 쪽의 넓은 짝
 */
export interface EventProviderRef {
  id: string;
  name: string;
}

/**
 * **`EventDetail.provider` 의 타입.** 상세(7.1) 주최사 블록이 한 줄 소개·평점까지
 * 그리므로 넓다. 왕복을 한 번 더 돌지 않으려고 상세 응답에 싣는다.
 *
 * `Summary → Ref` / `Detail → Detail` 로 짝이 맞는다 — 목록은 적게, 상세는 많이.
 *
 * @see EventProviderRef — `EventSummary` 쪽의 좁은 짝
 */
export interface EventProviderDetail extends EventProviderRef {
  /** 한 줄 소개 */
  tagline: string;
  /** 후기 `REVIEW_DISPLAY_MIN_COUNT` 건 미만이면 `null` — 화면은 `후기 N건` 만 쓴다 */
  rating: number | null;
  reviewCount: number;
}

/**
 * 가격·자격 판정의 기준이 되는 성별.
 *
 * `entities/user` 의 `UserProfile['gender']` 와 같은 값이지만 타입을 직접 참조하지
 * 않는다 — entity 끼리는 서로를 import 하지 않는다(FSD 동일 레이어 규칙).
 */
export type ViewerGender = "F" | "M";

export interface EventSummary {
  id: string;
  title: string;
  /** 비교함 컬럼 헤더용 축약 제목 (8장) */
  shortTitle: string;
  /** id 가 있어야 주최사 페이지 링크와 후기 귀속이 된다 (`decisions.md` 4.19) */
  provider: EventProviderRef;
  /**
   * `null` = 이미지 사용 미동의. **없는 것이 정상 경로다** — 동의 범위가
   * 정보/이미지/참석자 리스트로 나뉜다 (7.2 · `decisions.md` 4.18).
   */
  thumbnailUrl: string | null;

  /* ── 일정 ────────────────────────────────────────────── */

  /** ISO 8601 */
  date: string;
  /** '9/5(토)' — 서버가 내려주는 표시용 문자열 */
  dateLabel: string;
  /** '19:30' */
  timeLabel: string;
  timeSlot: TimeSlot;

  /* ── 참가 조건 ───────────────────────────────────────── */

  /**
   * 참가 가능 출생연도. 주최사는 나이가 아니라 **출생연도**로 모집한다
   * (`90~96년생`). 1990 = 90년생.
   */
  birthYearFrom: number;
  birthYearTo: number;

  /* ── 정원 ────────────────────────────────────────────── */

  /**
   * 남녀 분리 모집이라 **두 값은 같다**(7:7·15:15). 성비 게이지를 그리지 않고
   * `남 N · 여 N` 으로 쓴다. 둘로 유지하는 것은 비대칭 예외를 받기 위해서다 (4.14).
   */
  maleCapacity: number;
  femaleCapacity: number;
  /** 한쪽 성별 정원 기준 파생값. 서버 산출값이며 `deriveScale` 과 같은 규칙이다 */
  scale: EventScale;

  /* ── 가격 ────────────────────────────────────────────── */

  /**
   * 카드에는 **사용자 성별 기준값만**, 상세·외부 이동 모달에는 양쪽을 쓴다.
   * `null` = 가격 미확인 → 화면은 `링크 확인`, 상한 필터·`가성비` 배지에서 제외.
   */
  malePrice: number | null;
  femalePrice: number | null;

  status: EventStatus;

  /** 직업군 **집계값**. 자유 입력 태그라 닫힌 유니온이 아니다 (7.2 · 4.15) */
  jobGroups: string[];
  /** 분위기 태그 (6.4) */
  mood: string[];

  /* ── 위치 ────────────────────────────────────────────── */

  /** '성수·건대' — 동 단위. 프로필·온보딩 선호 지역과 연동되는 축 */
  area: string;
  /** MVP1은 'SEOUL' 고정 (6.1 / 6.3) */
  province: ProvinceCode;
  /** '성동구' — 구 단위. 지도/탐색 지역 필터 전용. `area` 와 별개 축이다 */
  district: DistrictCode;
  locationPrecision: LocationPrecision;
  /** `STATION` 일 때의 기준 역명. 마커 시트가 `○○역 인근` 을 쓴다 (4.13) */
  stationName: string | null;
  lat: number;
  lng: number;
  /** 위치 권한이 없으면 `null`. 화면에서는 '-' 로 떨어진다 (8장) */
  distanceKm: number | null;

  /* ── 평판·정렬 ───────────────────────────────────────── */

  /* rating·reviewCount 는 삭제됐다 — 평점은 주최사에 쌓인다 (`decisions.md` 4.19) */

  /** 정렬용 서버 산출값. 산식은 미확정 (16장) */
  popularity: number;
  /** ISO — 홈 '새로 등록된 소개팅' 섹션과 `sort=latest` 의 정렬 축 (5.3) */
  createdAt: string;
  isLiked: boolean;
}

export interface EventDetail extends EventSummary {
  /** 상세는 주최사 블록(7.1)을 그리므로 한 줄 소개·평점까지 받는다 */
  provider: EventProviderDetail;
  description: string;
  /** 'Bar noy' — `locationPrecision === 'EXACT'` 일 때만. 아니면 `null` */
  venueName: string | null;
  /** '서울 서초구 반포동 92-4' — 상동 */
  address: string | null;
  /** 주최사 외부 신청 페이지. 7.3 모달을 거쳐서만 연다 */
  externalApplyUrl: string;
  /**
   * 원본 참석자 리스트 링크. **주최사가 표시에 동의한 경우에만** 채운다 (7.2).
   * 리스트 자체를 복제해 오지 않고 아웃링크로만 보낸다.
   */
  attendeeListUrl: string | null;
  images: string[];
}

/* ── 조회 파라미터 (6.1 URL 설계와 1:1) ─────────────────── */

export interface EventListQuery {
  province?: ProvinceCode;
  /** 'ALL' 이면 전지역 */
  district?: DistrictCode | "ALL";
  when?: WhenFilter;
  slot?: TimeSlotFilter;
  scale?: ScaleFilter;
  status?: StatusFilter;
  /** 사용자 성별 기준 단일 축. 서버가 인증 주체로 해석한다(13장). 게스트 미노출 */
  maxPrice?: number;
  /** 출생연도가 모집 범위에 들고 내 성별 정원이 0이 아닌 건만. 기본 ON (6.4) */
  eligibleOnly?: boolean;
  sort?: SortOption;
  /** 분위기 다중 선택 (OR 조건) */
  mood?: string[];
  /** 동 단위 지역 (프로필 선호 지역) */
  area?: string;
  /** 주최사 페이지(7.4)가 `status: 'OPEN'` 과 함께 걸어 모집 중인 회차만 가져온다 */
  providerId?: string;
  cursor?: string | null;
  limit?: number;
}

/**
 * 홈 섹션 키. `HomeFeed` 의 배열 필드와 1:1 이고 **섹션이 늘면 여기부터 늘린다** —
 * 모집 중 필터(4.23)가 새 섹션에도 걸리려면 목록이 한곳에 있어야 한다.
 */
export const HOME_SECTION_KEYS = ["weeklyPopular", "myAgeGroup", "newlyAdded"] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

/**
 * 홈 3개 섹션 일괄 조회 응답 (5.3).
 *
 * ⚠️ **세 섹션 모두 모집 중(`status: '신청 가능'`)만 담긴다.** 홈에는 상태 필터도
 * 상태 배지도 없어서(`decisions.md` 4.23) 마감 건이 섞이면 사용자가 알아챌
 * 방법이 없다. **거르는 것은 서버의 책임**이고 `EventApi.getHomeFeed` 의 계약이다.
 *
 * `HomeSectionKey` 를 확장하면 이 인터페이스가 새 필드를 요구한다 — 섹션이
 * 늘었는데 필터에서 빠지는 일이 타입에서 걸리게 하려는 것이다.
 */
export interface HomeFeed extends Record<HomeSectionKey, EventSummary[]> {
  /** 이번 주 인기 소개팅 — 이번 주 개최 + popularity 내림차순, 최대 6건 */
  weeklyPopular: EventSummary[];
  /** 내 나이대 — 게스트·출생연도 미입력이면 **화면이** 섹션을 숨긴다 (5.3) */
  myAgeGroup: EventSummary[];
  /** 새로 등록된 소개팅 — `createdAt` 내림차순, 최대 4건 */
  newlyAdded: EventSummary[];
  /** 추천 기준 문구용. 위치 권한 거부 시 선호 지역명으로 대체된다 (5-5) */
  baseAreaLabel: string;
}
