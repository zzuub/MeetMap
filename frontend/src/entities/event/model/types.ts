import type { DistrictCode, ProvinceCode } from "@/shared/config";

/** 근거: docs/frontend-feature-spec.md 12장 */

export type TimeSlot = "LUNCH" | "DINNER" | "LATE_NIGHT";
export type TimeSlotFilter = TimeSlot | "ALL";

export type EventStatus = "모집중" | "마감임박" | "마감";

/**
 * 소개팅 측 성별 모집 정책.
 *
 * ⚠️ 목업의 성별 필터는 `무관`이 아니면 결과가 항상 0건이 되는 미완성 상태다(6.4).
 * 이 필드 정의가 확정되기 전까지 필터 매칭 로직을 구현하지 않는다
 * (dev-plan blocking #4).
 */
export type GenderPolicy = "ANY" | "BALANCED" | "MALE_ONLY" | "FEMALE_ONLY";

/** 탐색 필터의 성별 조건 (6.4) — 소개팅 측 정책과 다른 축이다 */
export type GenderFilter = "ANY" | "MALE" | "FEMALE";

export type SortOption = "popular" | "latest" | "priceAsc" | "priceDesc";

export interface EventSummary {
  id: string;
  title: string;
  /** 비교함 컬럼 헤더용 축약 제목 (8장) */
  shortTitle: string;
  /** 주최사 */
  provider: string;
  category: string;
  thumbnailUrl: string;
  /** ISO 8601 */
  date: string;
  /** '8/14(목)' — 서버가 내려주는 표시용 문자열 */
  dateLabel: string;
  /** '19:30' */
  timeLabel: string;
  timeSlot: TimeSlot;
  /** KRW */
  price: number;
  status: EventStatus;
  remainingSeats: number;
  minAge: number;
  maxAge: number;
  /** 0~100 */
  femaleRatio: number;
  genderPolicy: GenderPolicy;
  /** 분위기 태그 (6.4) */
  mood: string[];
  /** '성수동' — 동 단위. 프로필·온보딩 선호 지역과 연동되는 축 */
  area: string;
  /** MVP1은 'SEOUL' 고정 (6.1 / 6.3) */
  province: ProvinceCode;
  /** '성동구' — 구 단위. 지도/탐색 지역 필터 전용. `area` 와 별개 축이다 */
  district: DistrictCode;
  /** 위치 권한이 없으면 `null`. 화면에서는 '-' 로 떨어진다 (8장) */
  distanceKm: number | null;
  /** 0~5 */
  rating: number;
  reviewCount: number;
  /** 정렬용 서버 산출값. 산식은 미확정 (16장) */
  popularity: number;
  isLiked: boolean;
  lat: number;
  lng: number;
}

export interface EventDetail extends EventSummary {
  description: string;
  /** ISO 8601 — 신청 마감 시각 */
  applyDeadline: string;
  /** 주최사 외부 신청 페이지. 7.3 모달을 거쳐서만 연다 */
  externalApplyUrl: string;
  images: string[];
}

/* ── 조회 파라미터 (6.1 URL 설계와 1:1) ─────────────────── */

export interface EventListQuery {
  province?: ProvinceCode;
  /** 'ALL' 이면 전지역 */
  district?: DistrictCode | "ALL";
  slot?: TimeSlotFilter;
  sort?: SortOption;
  /** 분위기 다중 선택 (OR 조건) */
  mood?: string[];
  only20s?: boolean;
  gender?: GenderFilter;
  /** 동 단위 지역 (프로필 선호 지역) */
  area?: string;
  cursor?: string | null;
  limit?: number;
}

/** 홈 3개 섹션 일괄 조회 응답 (5.3) */
export interface HomeFeed {
  /** 오늘 인기 소개팅 — popularity 내림차순, 최대 6건 */
  popular: EventSummary[];
  /** 여성 신청 많은 소개팅 — femaleRatio 내림차순, 최대 6건 */
  femaleFriendly: EventSummary[];
  /** 지금 신청 가능한 소개팅 — status === '모집중', 최대 4건 */
  openNow: EventSummary[];
  /** 추천 기준 문구용. 위치 권한 거부 시 선호 지역명으로 대체된다 (5-5) */
  baseAreaLabel: string;
}
