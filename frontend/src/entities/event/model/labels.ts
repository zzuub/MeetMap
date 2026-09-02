import { DISTRICT_LABEL, SCALE_OPTIONS, TIME_SLOTS } from "@/shared/config";
import { priceFor } from "./derive";
import type { EventScale, EventSummary, TimeSlot, ViewerGender } from "./types";

/**
 * 표시 문자열 생성 (순수 함수).
 *
 * `derive.ts` 가 **도메인 판정**(자격·규모·이번 주)을 맡는다면 여기는 **표기 규칙**을
 * 맡는다. 둘 다 순수하고 둘 다 화면이 다시 구현하면 안 되는 규칙이라 `model/` 에
 * 나란히 둔다.
 *
 * 컴포넌트가 아니라 함수로 두는 이유:
 * - 같은 문자열이 `aria-label`·지도 마커·비교표처럼 JSX 가 아닌 자리에도 쓰인다
 * - 경계값(가격 `null`, 세기가 바뀌는 출생연도)을 DOM 없이 단위 테스트로 덮을 수 있다
 *
 * 세리프 숫자(`Numeric`)는 **컴포넌트가 감싼다.** 여기서는 문자열만 만든다 —
 * 문자열 안에 마크업을 섞으면 `aria-label` 에 쓸 수 없게 된다.
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

/**
 * `1996` → `'96년생'`.
 *
 * 주최사는 나이가 아니라 **출생연도**로 모집한다. 두 자리 표기가 게시물의 관용
 * 표기(`90~96년생`)와 같다.
 */
export function birthYearLabel(year: number): string {
  return `${twoDigitYear(year)}년생`;
}

/**
 * `1990, 1996` → `'90~96년생'` / `1997, 2003` → `'97~03년생'`.
 *
 * 2000년대생이 섞이면 `97~03` 처럼 숫자가 작아진다. 두 자리 표기가 관용이므로
 * 그대로 두되, `03` 의 앞 `0` 을 떨어뜨리지 않는다 — `97~3년생` 은 읽히지 않는다.
 */
export function birthYearRangeLabel(from: number, to: number): string {
  if (from === to) return birthYearLabel(from);
  return `${twoDigitYear(from)}~${twoDigitYear(to)}년생`;
}

/* ── 정원 ───────────────────────────────────────────────── */

/**
 * `7, 7` → `'남 7 · 여 7'`.
 *
 * **성비 게이지를 그리지 않는다.** 남녀 정원이 고정 동수라 성비는 항상 50% 다
 * (`progress.md` 4.14). 비대칭 회차가 들어와도 이 표기는 그대로 답을 낸다.
 */
export function capacityLabel(maleCapacity: number, femaleCapacity: number): string {
  return `남 ${maleCapacity} · 여 ${femaleCapacity}`;
}

/* ── 가격 ───────────────────────────────────────────────── */

/**
 * 가격 표기의 세 갈래.
 *
 * - `single` — 로그인 사용자에게는 **자기 성별 기준값만** 보여준다 (2.2 UI 원칙)
 * - `both` — 게스트에게는 병기한다. 어느 쪽이 자기 값인지 알 수 없기 때문이다
 * - `unknown` — 내 기준 가격이 없으면 `링크 확인`. 상한 필터가 이 건을 제외하는
 *   규칙(`eventApi.mock.ts`)과 같은 판단이다
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
 * 위치 정밀도별 표기 (6.6 / 7.1).
 *
 * `EXACT` 가 아닌 건을 정확한 주소처럼 보이게 하면 사용자가 헛걸음한다.
 * 정확한 장소(`venueName`·`address`)는 `EventDetail` 에만 있으므로 여기서는
 * 지역까지만 답한다.
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

/** `'로테이션서울 · 디너 19:30'` — 홈 `새로 등록된` 소형 카드 (5.3) */
export function providerSlotLabel(
  event: Pick<EventSummary, "provider" | "timeSlot" | "timeLabel">,
): string {
  return `${event.provider.name} · ${timeSlotLabel(event.timeSlot)} ${event.timeLabel}`;
}

/* ── 내부 ───────────────────────────────────────────────── */

function twoDigitYear(year: number): string {
  return String(year % 100).padStart(2, "0");
}

function districtLabel(event: Pick<EventSummary, "district" | "area">): string {
  return DISTRICT_LABEL[event.district] ?? event.area;
}

/**
 * 마스터 배열에서 라벨을 뽑는다. 라벨 문자열을 이 파일에 복사해 두면
 * `constants.ts` 를 고쳤을 때 조용히 어긋난다.
 */
function labelOf(
  options: readonly { code: string; label: string }[],
  code: string,
): string {
  const found = options.find((option) => option.code === code);
  if (!found) throw new Error(`알 수 없는 코드: ${code}`);
  return found.label;
}
