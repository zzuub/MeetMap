import { describe, expect, it } from "vitest";
import { countNearby, type CountableEvent } from "./counts";

/**
 * 4.2 의 `오늘 저녁 N건 · 심야 N건`.
 *
 * 두 축이 곱해진다 — **날짜(오늘인가)** × **시간대(저녁/심야)**. 한 축만 보면
 * 어제 저녁 회차가 오늘로 세어지거나, 오늘 낮 회차가 저녁으로 세어진다.
 */
const now = new Date("2026-09-10T12:00:00+09:00");

const at = (iso: string, timeSlot: CountableEvent["timeSlot"]): CountableEvent => ({
  date: iso,
  timeSlot,
});

describe("주변 건수 (4.2)", () => {
  it("오늘의 저녁·심야만 센다", () => {
    const counts = countNearby(
      5,
      [
        at("2026-09-10T19:30:00+09:00", "DINNER"),
        at("2026-09-10T22:00:00+09:00", "LATE_NIGHT"),
        at("2026-09-10T11:00:00+09:00", "MORNING"),
        at("2026-09-11T19:30:00+09:00", "DINNER"),
        at("2026-09-09T22:00:00+09:00", "LATE_NIGHT"),
      ],
      now,
    );

    expect(counts.today).toEqual({ dinner: 1, lateNight: 1 });
  });

  it("전체 건수는 항목이 아니라 응답의 값을 쓴다", () => {
    // 목록이 한 페이지에 다 안 들어와도 `총 N건` 은 정확해야 한다
    expect(countNearby(42, [at("2026-09-10T19:30:00+09:00", "DINNER")], now).total).toBe(
      42,
    );
  });

  it("다 못 받았으면 오늘 건수를 포기한다 — 전체 건수는 남는다 (4.28)", () => {
    expect(countNearby(400, null, now)).toEqual({ total: 400, today: null });
  });

  it("오늘 것이 없으면 0이다 — `null`(못 셈)과 다른 상태다", () => {
    const counts = countNearby(1, [at("2026-09-12T19:30:00+09:00", "DINNER")], now);
    expect(counts.today).toEqual({ dinner: 0, lateNight: 0 });
  });

  it("오늘이지만 저녁·심야가 아닌 회차는 어느 쪽에도 안 들어간다", () => {
    const counts = countNearby(
      2,
      [
        at("2026-09-10T11:00:00+09:00", "MORNING"),
        at("2026-09-10T14:00:00+09:00", "AFTERNOON"),
      ],
      now,
    );

    expect(counts.today).toEqual({ dinner: 0, lateNight: 0 });
  });
});
