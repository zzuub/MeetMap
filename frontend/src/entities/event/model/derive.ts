import {
  SCALE_LARGE_MIN_PER_SIDE,
  SCALE_SMALL_MAX_PER_SIDE,
  TIME_SLOT_START_HOUR,
} from "@/shared/config";
import type { EventScale, EventSummary, TimeSlot, ViewerGender } from "./types";

/**
 * 순수 파생 규칙.
 *
 * 실 서버가 내려줄 값(`scale`)과 서버가 인증 주체로 해석할 조건(`eligibleOnly`,
 * `maxPrice`)의 산출 규칙을 한곳에 둔다. 목 API 가 이걸 쓰고, 화면도 같은 규칙이
 * 필요할 때 여기서 가져간다 — 두 벌이 되면 목과 실서버가 다르게 걸러진다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * 한쪽 성별 정원으로 규모를 정한다 (6.4).
 * 소수정예 `5:5` 이하 / 표준 `6:6`~`9:9` / 대규모 `10:10` 이상.
 *
 * **전제: 로테이션 소개팅은 남녀 동수 모집이다.** 주최사가 `7:7`·`15:15` 처럼
 * 정원을 고정해 따로 모집하므로 두 값이 같다 — 그래서 6.4 의 `N:N` 표기를
 * 그대로 경계로 쓸 수 있다.
 *
 * 그럼에도 **큰 쪽**을 기준으로 삼는 것은 예외 처리다. 한쪽만 추가 모집하는
 * 회차(`10:4`) 같은 비대칭 건이 나중에 들어와도 판정이 멈추지 않아야 한다.
 * 이때 "한쪽이라도 10명을 모집하면 대규모"가 사용자가 체감하는 규모에 가깝다.
 */
export function deriveScale(maleCapacity: number, femaleCapacity: number): EventScale {
  const perSide = Math.max(maleCapacity, femaleCapacity);
  if (perSide <= SCALE_SMALL_MAX_PER_SIDE) return "SMALL";
  if (perSide < SCALE_LARGE_MIN_PER_SIDE) return "STANDARD";
  return "LARGE";
}

/**
 * KST 기준 이번 주(월 00:00 ~ 일 23:59:59.999)의 범위를 epoch ms 로 돌려준다.
 *
 * 서버·클라이언트 어디서 돌아도 같은 답이 나와야 해서 실행 환경의 타임존에
 * 기대지 않는다. UTC 로 +9h 밀어 KST 달력 날짜를 읽고, 계산한 경계를 다시 되돌린다.
 */
export function weekRangeKst(now: Date): { start: number; end: number } {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  // getUTCDay: 0=일요일. 월요일 시작 주로 바꾼다.
  const daysSinceMonday = (kst.getUTCDay() + 6) % 7;

  const startKst = Date.UTC(
    kst.getUTCFullYear(),
    kst.getUTCMonth(),
    kst.getUTCDate() - daysSinceMonday,
  );
  const endKst = startKst + 7 * 24 * 60 * 60 * 1000 - 1;

  return { start: startKst - KST_OFFSET_MS, end: endKst - KST_OFFSET_MS };
}

/** 일정 필터 `THIS_WEEK` 판정 (6.4) */
export function isThisWeek(iso: string, now: Date = new Date()): boolean {
  const at = new Date(iso).getTime();
  const { start, end } = weekRangeKst(now);
  return at >= start && at <= end;
}

/**
 * 현재 시간대 (5-5 홈 추천 기준 문구).
 *
 * 경계는 **시작 시각** 기준이라 12:00 은 `오후`, 21:00 은 `심야`다 (6.2).
 * `weekRangeKst` 와 같은 이유로 실행 환경의 타임존에 기대지 않는다 — 서버에서
 * 그려도 사용자가 보는 시각(KST)과 같은 답이 나와야 한다.
 */
export function currentTimeSlot(now: Date = new Date()): TimeSlot {
  const hour = new Date(now.getTime() + KST_OFFSET_MS).getUTCHours();

  if (hour < TIME_SLOT_START_HOUR.AFTERNOON) return "MORNING";
  if (hour < TIME_SLOT_START_HOUR.DINNER) return "AFTERNOON";
  if (hour < TIME_SLOT_START_HOUR.LATE_NIGHT) return "DINNER";
  return "LATE_NIGHT";
}

/**
 * 모집 중 판정 (6.4 `status=OPEN` / 5.3 홈).
 *
 * 상태는 2종뿐이라 조건 자체는 한 줄이지만, 탐색 필터와 홈 피드가 **같은 함수**를
 * 봐야 한다 — 두 벌이 되면 한쪽만 고쳐졌을 때 홈에 마감 건이 되살아난다.
 */
export function isOpen(event: Pick<EventSummary, "status">): boolean {
  return event.status === "신청 가능";
}

/** 사용자 성별 기준 참가비. 미확인 건은 `null` (12장) */
export function priceFor(
  event: Pick<EventSummary, "malePrice" | "femalePrice">,
  gender: ViewerGender,
): number | null {
  return gender === "F" ? event.femalePrice : event.malePrice;
}

/**
 * `내 나이대 아님` 표시 여부 (6.4 / 6.5).
 *
 * 세 조건이 **모두** 참일 때만 그린다.
 *
 * 1. **자격 필터가 꺼져 있다.** 켜져 있으면 남은 건이 전부 자격을 만족해 표시가 늘
 *    같은 값이 된다 — 같은 값만 찍히는 배지는 정보가 아니다 (`decisions.md` 4.23).
 *    게스트는 이 축 자체가 없어(`undefined`) 여기서 걸린다.
 * 2. **판정 주체가 있다.** 출생연도·성별을 모르면 자격을 말할 수 없다.
 * 3. 실제로 자격 밖이다.
 *
 * 상단 칩 줄은 필터가 **켜져 있을 때** `내 나이대` 칩으로 고지한다. 끄면 그 칩이
 * 사라지므로, 이 표시가 없으면 자격 밖 회차가 아무 고지 없이 섞인다.
 */
export function marksIneligible(
  event: Pick<
    EventSummary,
    "birthYearFrom" | "birthYearTo" | "maleCapacity" | "femaleCapacity"
  >,
  viewer: { birthYear: number; gender: ViewerGender } | null,
  /** 목록에 걸린 `eligibleOnly`. 게스트는 축 자체가 없어 `undefined` 다 (6.1) */
  eligibleOnly: boolean | undefined,
): boolean {
  if (eligibleOnly !== false) return false;
  if (viewer === null) return false;
  return !isEligible(event, viewer);
}

/**
 * 자격 판정 (6.4 1층 / 6.1 `eligibleOnly`).
 *
 * 출생연도가 모집 범위에 들고, **내 성별 정원이 0이 아니어야** 한다.
 * 로테이션 소개팅은 남녀 분리 모집이라 한쪽만 추가 모집하는 회차가 나올 수 있다.
 */
export function isEligible(
  event: Pick<
    EventSummary,
    "birthYearFrom" | "birthYearTo" | "maleCapacity" | "femaleCapacity"
  >,
  viewer: { birthYear: number; gender: ViewerGender },
): boolean {
  if (viewer.birthYear < event.birthYearFrom) return false;
  if (viewer.birthYear > event.birthYearTo) return false;

  const capacity = viewer.gender === "F" ? event.femaleCapacity : event.maleCapacity;
  return capacity > 0;
}
