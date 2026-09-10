import { isTodayKst, type EventSummary } from "@/entities/event";
import type { NearbyCounts } from "./types";

/** 4.2 의 두 숫자를 세는 규칙 */

/** 세는 대상. 목록 응답의 일부만 받으므로 `EventSummary` 를 통째로 요구하지 않는다 */
export type CountableEvent = Pick<EventSummary, "date" | "timeSlot">;

/**
 * `주변 소개팅 N건` 과 `오늘 저녁 N건 · 심야 N건` (4.2).
 *
 * 두 값의 출처가 다른 것이 요점이다.
 * - `total` 은 목록 응답의 전체 건수다. 상한과 무관하게 정확하다
 * - `today` 는 **항목을 긁어와야** 나온다. 상한을 넘겨 다 못 받았으면(`items === null`)
 *   `null` 이다 — 덜 받은 것으로 세면 조용히 실제보다 작아진다 (`decisions.md` 4.28)
 *
 * 액션이 아니라 여기 있는 이유는 `"use server"` 파일이 **async 만 export** 할 수
 * 있어서다. 규칙은 순수 함수로 떼어 두고 테스트가 직접 부른다.
 */
export function countNearby(
  total: number,
  items: readonly CountableEvent[] | null,
  now: Date = new Date(),
): NearbyCounts {
  if (items === null) return { total, today: null };

  const today = items.filter((event) => isTodayKst(event.date, now));

  return {
    total,
    today: {
      dinner: today.filter((event) => event.timeSlot === "DINNER").length,
      lateNight: today.filter((event) => event.timeSlot === "LATE_NIGHT").length,
    },
  };
}
