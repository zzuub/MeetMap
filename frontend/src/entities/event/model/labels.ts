import { DISTRICT_LABEL, SCALE_OPTIONS, TIME_SLOTS } from "@/shared/config";
import { canShowRating, formatDistance } from "@/shared/lib";
import { priceFor } from "./derive";
import type {
  EventDetail,
  EventProviderDetail,
  EventScale,
  EventSummary,
  TimeSlot,
  ViewerGender,
} from "./types";

/**
 * 표시 문자열 생성 (순수 함수).
 *
 * `derive.ts` 가 도메인 판정을 맡고 여기는 표기 규칙을 맡는다. **문자열만 만들고
 * 세리프 래핑은 컴포넌트가 한다** — 같은 문자열이 `aria-label`·지도 마커처럼
 * JSX 아닌 자리에도 쓰이기 때문이다.
 */

/** 가격 미확인 건의 표기 (12장). 신청 폼 안에만 가격이 있어 등록 시 확보 못 한 건이다. */
export const PRICE_UNKNOWN_LABEL = "링크 확인";

const TIME_SLOT_LABEL: Record<TimeSlot, string> = {
  MORNING: labelOf(TIME_SLOTS, "MORNING"),
  AFTERNOON: labelOf(TIME_SLOTS, "AFTERNOON"),
  DINNER: labelOf(TIME_SLOTS, "DINNER"),
  LATE_NIGHT: labelOf(TIME_SLOTS, "LATE_NIGHT"),
};

const SCALE_LABEL: Record<EventScale, string> = {
  SMALL: labelOf(SCALE_OPTIONS, "SMALL"),
  STANDARD: labelOf(SCALE_OPTIONS, "STANDARD"),
  LARGE: labelOf(SCALE_OPTIONS, "LARGE"),
};

export function timeSlotLabel(slot: TimeSlot): string {
  return TIME_SLOT_LABEL[slot];
}

export function scaleLabel(scale: EventScale): string {
  return SCALE_LABEL[scale];
}

/* ── 출생연도 ───────────────────────────────────────────── */

/** `1996` → `'96년생'`. 주최사는 나이가 아니라 출생연도로 모집한다 */
export function birthYearLabel(year: number): string {
  return `${twoDigitYear(year)}년생`;
}

/** `1997, 2003` → `'97~03년생'`. 앞 `0` 을 떨어뜨리면 `97~3년생` 이 되어 안 읽힌다 */
export function birthYearRangeLabel(from: number, to: number): string {
  if (from === to) return birthYearLabel(from);
  return `${twoDigitYear(from)}~${twoDigitYear(to)}년생`;
}

/* ── 정원 ───────────────────────────────────────────────── */

/** `7, 7` → `'남 7 · 여 7'`. 성비 게이지를 그리지 않는 이유는 4.14 */
export function capacityLabel(maleCapacity: number, femaleCapacity: number): string {
  return `남 ${maleCapacity} · 여 ${femaleCapacity}`;
}

/* ── 가격 ───────────────────────────────────────────────── */

/**
 * 가격 표기의 세 갈래 — 로그인 사용자는 자기 성별 기준값만(`single`), 게스트는
 * 어느 쪽이 자기 값인지 몰라 병기(`both`), 내 기준 값이 없으면 `unknown`.
 */
export type PriceDisplay =
  | { kind: "unknown" }
  | { kind: "single"; amount: number }
  | { kind: "both"; male: number | null; female: number | null };

export function priceDisplay(
  event: Pick<EventSummary, "malePrice" | "femalePrice">,
  gender: ViewerGender | null,
): PriceDisplay {
  if (gender === null) {
    if (event.malePrice === null && event.femalePrice === null) {
      return { kind: "unknown" };
    }
    return { kind: "both", male: event.malePrice, female: event.femalePrice };
  }

  // 한쪽만 미확인인 건은 목에 없지만, 그때도 **내 기준값**이 없으면 모르는 것이다.
  const amount = priceFor(event, gender);
  return amount === null ? { kind: "unknown" } : { kind: "single", amount };
}

/* ── 위치 ───────────────────────────────────────────────── */

/**
 * 위치 정밀도별 표기 (6.6). `EXACT` 가 아닌 건을 정확한 주소처럼 보이게 하면
 * 헛걸음한다. 정확한 장소는 `EventDetail` 에만 있어 여기서는 지역까지만 답한다.
 */
export function locationLabel(
  event: Pick<
    EventSummary,
    "locationPrecision" | "stationName" | "district" | "area"
  >,
): string {
  switch (event.locationPrecision) {
    case "STATION":
      // 역명이 비어 있으면 한 단계 내려 구로 떨어뜨린다. `undefined 인근` 은 막는다.
      return event.stationName ? `${event.stationName} 인근` : districtLabel(event);
    case "DISTRICT":
      return districtLabel(event);
    case "EXACT":
      return event.area;
  }
}

/* ── 메타 줄 ────────────────────────────────────────────── */

/** `'로테이션서울 · 9/4(금) 19:30'` — 리스트(6.5) · 마커 시트(6.6) 헤더 */
export function providerScheduleLabel(
  event: Pick<EventSummary, "provider" | "dateLabel" | "timeLabel">,
): string {
  return `${event.provider.name} · ${event.dateLabel} ${event.timeLabel}`;
}

/**
 * `'로테이션서울 · 9/4(금) 19:30 · 성수·건대'` — 검색 결과 카드 (11.1).
 *
 * 지역은 `locationLabel`(`강남역 인근`)이 아니라 **`area` 그대로**다 — 검색 대상 필드라
 * 결과가 왜 걸렸는지를 카드가 보여 줘야 한다. `건대` 로 찾은 사람에게 `성수 루프탑 …`
 * 만 보이면 엉뚱한 결과로 읽힌다 (`decisions.md` 4.67).
 */
export function searchMetaLabel(
  event: Pick<EventSummary, "provider" | "dateLabel" | "timeLabel" | "area">,
): string {
  return `${providerScheduleLabel(event)} · ${event.area}`;
}

/** `'로테이션서울 · 디너 19:30'` — 홈 `새로 등록된` 소형 카드 (5.3) */
export function providerSlotLabel(
  event: Pick<EventSummary, "provider" | "timeSlot" | "timeLabel">,
): string {
  return `${event.provider.name} · ${timeSlotLabel(event.timeSlot)} ${event.timeLabel}`;
}

/**
 * `'로테이션서울 · 9/4(금) 19:30 · 성수·건대 1.2km'` — 상세 메타 줄 (7.1).
 *
 * 리스트의 메타 줄(`providerScheduleLabel`)에 **지역·거리를 덧붙인 것**이라
 * 앞부분을 다시 조립하지 않고 그 함수를 그대로 부른다. 지역 표기도 마찬가지로
 * `locationLabel` 을 거친다 — 정밀도 3분기가 두 벌이 되면 상세만 `강남역 인근`
 * 대신 동 이름을 쓰는 식으로 어긋난다.
 *
 * ⚠️ **거리는 모르면 아예 빼고, `-` 로 채우지 않는다.** `formatDistance` 의 `-` 는
 * 비교함(8장) 표처럼 **칸을 비울 수 없는 자리**의 규칙이다. 문장 안에서 `성수·건대
 * -km` 는 값이 아니라 오식으로 읽힌다.
 */
export function detailMetaLabel(
  event: Pick<
    EventSummary,
    | "provider"
    | "dateLabel"
    | "timeLabel"
    | "locationPrecision"
    | "stationName"
    | "district"
    | "area"
    | "distanceKm"
  >,
): string {
  const place =
    event.distanceKm === null
      ? locationLabel(event)
      : `${locationLabel(event)} ${formatDistance(event.distanceKm)}`;

  return `${providerScheduleLabel(event)} · ${place}`;
}

/* ── 상세 전용 ──────────────────────────────────────────── */

/**
 * 상세의 장소 표기 (7.1 장소 행).
 *
 * `EXACT` 만 상세에서 달라진다 — 장소명과 주소가 `EventDetail` 에만 있어서다.
 * 나머지 둘은 카드·마커 시트와 **같은 문자열**이어야 하므로 `locationLabel` 로
 * 떨어뜨린다. 정밀도 분기를 여기서 다시 쓰면 두 화면이 서로 다른 답을 낸다.
 *
 * `EXACT` 인데 장소명이 비어 있으면 근사 표기로 내린다 — `locationLabel` 이
 * 역명 없는 `STATION` 을 구로 내리는 것과 같은 규칙이다.
 */
export type VenueDisplay =
  | { kind: "exact"; venueName: string; address: string | null }
  | { kind: "approximate"; label: string };

export function venueDisplay(
  event: Pick<
    EventDetail,
    | "locationPrecision"
    | "stationName"
    | "district"
    | "area"
    | "venueName"
    | "address"
  >,
): VenueDisplay {
  if (event.locationPrecision === "EXACT" && event.venueName) {
    return { kind: "exact", venueName: event.venueName, address: event.address };
  }
  return { kind: "approximate", label: locationLabel(event) };
}

/**
 * 주최사 평점 표기 (7.1 주최사 블록 / 7.4).
 *
 * **평점은 항상 후기 건수와 함께 쓴다** — `4.6` 만 있으면 5건짜리와 500건짜리가
 * 같아 보인다. 표시 임계(5건) 미달이면 숫자를 버리고 `후기 N건` 만 남긴다.
 *
 * `EventProviderDetail.rating` 은 **이미 임계가 적용된 값**(12장)인데도 건수를
 * 한 번 더 본다 — `openSectionsOnly`(4.23)와 같은 방어선이고, **언제 이 형태를
 * 쓰는지는 4.35 의 사다리**가 정한다. 여기가 걸리는 이유는 사용자에게 이 값을
 * 걷어낼 컨트롤이 없어서다: 3건짜리 평점이 내려와도 표본이 몇 건인지 알 방법이 없다.
 */
export type RatingDisplay =
  | { kind: "score"; rating: number; reviewCount: number }
  | { kind: "countOnly"; reviewCount: number };

export function providerRatingDisplay(
  provider: Pick<EventProviderDetail, "rating" | "reviewCount">,
): RatingDisplay {
  if (provider.rating === null || !canShowRating(provider.reviewCount)) {
    return { kind: "countOnly", reviewCount: provider.reviewCount };
  }
  return {
    kind: "score",
    rating: provider.rating,
    reviewCount: provider.reviewCount,
  };
}

/* ── 내부 ───────────────────────────────────────────────── */

function twoDigitYear(year: number): string {
  return String(year % 100).padStart(2, "0");
}

function districtLabel(event: Pick<EventSummary, "district" | "area">): string {
  return DISTRICT_LABEL[event.district] ?? event.area;
}

/** 라벨을 복사해 두면 `constants.ts` 를 고쳤을 때 조용히 어긋난다 */
function labelOf(
  options: readonly { code: string; label: string }[],
  code: string,
): string {
  const found = options.find((option) => option.code === code);
  if (!found) throw new Error(`알 수 없는 코드: ${code}`);
  return found.label;
}
