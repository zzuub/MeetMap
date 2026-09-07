import { describe, expect, it } from "vitest";
import {
  formatDistance,
  formatEventDate,
  formatEventDateTime,
  formatEventTime,
  formatNumber,
  formatPrice,
  formatRelativeTime,
  normalizeHour24,
} from "./format";

/**
 * 표시용 포매터.
 *
 * **고정 입력 → 고정 출력으로 잠근다.** 목 데이터를 전혀 거치지 않는다 —
 * `derive.test.ts` 가 `weekRangeKst` 를 절대 ISO + 고정 `now` 로 잠근 것과 같은
 * 전략이다.
 *
 * 이 파일이 비어 있던 것이 PR #27 리뷰가 짚은 진짜 빈틈이다. 목 데이터의
 * `dateLabel` 은 `formatEventDate(date)` 로 **파생**되므로 그 둘을 비교하는 테스트는
 * 항등식이 되어 아무것도 검증하지 못한다(`decisions.md` 4.31). 포매터가 옳은지는
 * 목을 안 거치는 **여기서만** 증명된다.
 *
 * `Intl` 에 `timeZone: "Asia/Seoul"` 을 박아 두었으므로 실행 환경 타임존이 달라도
 * 같은 답이 나와야 한다 — CI 의 타임존 매트릭스가 그것을 확인한다.
 */

describe("formatEventDate", () => {
  it("KST 기준 `월/일(요일)` 이고 0 을 채우지 않는다", () => {
    // 목업의 `dateLabel` 형식 (12장). `09/04` 가 아니라 `9/4` 다
    expect(formatEventDate("2026-09-04T19:30:00+09:00")).toBe("9/4(금)");
    expect(formatEventDate("2026-01-01T09:05:00+09:00")).toBe("1/1(목)");
  });

  it("실행 환경이 아니라 KST 달력으로 날짜를 읽는다", () => {
    // UTC 로는 9/4 지만 KST 로는 이미 9/5(토) 다. 로컬 TZ 를 읽으면 여기서 갈린다
    expect(formatEventDate("2026-09-04T15:00:00Z")).toBe("9/5(토)");
  });

  it("자정은 날짜가 넘어간 쪽에 붙는다", () => {
    expect(formatEventDate("2026-09-04T00:00:00+09:00")).toBe("9/4(금)");
  });
});

describe("formatEventTime", () => {
  it("24시간제 `HH:mm` 이고 0 을 채운다", () => {
    expect(formatEventTime("2026-09-04T19:30:00+09:00")).toBe("19:30");
    expect(formatEventTime("2026-01-01T09:05:00+09:00")).toBe("09:05");
  });

  it("자정은 24:00 이 아니라 00:00 이다", () => {
    expect(formatEventTime("2026-09-04T00:00:00+09:00")).toBe("00:00");
  });

  it("정오는 12:00 이다", () => {
    expect(formatEventTime("2026-09-04T12:00:00+09:00")).toBe("12:00");
  });

  /*
   * ⚠️ 위 자정 케이스는 `normalizeHour24` 를 **밟지 못한다.** 이 환경의 ICU 는
   * `hour12: false` 에서 자정을 이미 `"00"` 으로 주기 때문이다(그 줄을 지워도
   * 통과한다 — 변이로 확인). `Intl` 을 속일 수단이 없어 방어선 자체는 아래에서
   * 따로 본다.
   */
});

describe("normalizeHour24", () => {
  it("`24` 를 자정(0)으로 접는다", () => {
    // `hour12: false` 에서 자정을 `"24"` 로 주는 구현이 실재했다. 이 방어선이
    // 없으면 그런 환경에서 `24:00` 이 화면에 뜬다 (PR #27 3차 리뷰)
    expect(normalizeHour24("24")).toBe(0);
  });

  it("나머지 시각은 그대로 둔다", () => {
    expect(normalizeHour24("00")).toBe(0);
    expect(normalizeHour24("09")).toBe(9);
    expect(normalizeHour24("23")).toBe(23);
  });
});

describe("formatEventDateTime", () => {
  it("날짜와 시각을 공백 하나로 잇는다", () => {
    expect(formatEventDateTime("2026-09-04T19:30:00+09:00")).toBe("9/4(금) 19:30");
  });
});

describe("formatPrice · formatNumber", () => {
  it("천 단위를 끊는다", () => {
    expect(formatPrice(12000)).toBe("12,000원");
    expect(formatNumber(12000)).toBe("12,000");
  });

  it("`formatNumber` 는 단위를 붙이지 않는다 — `Numeric` 이 따로 붙인다", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatPrice(0)).toBe("0원");
  });
});

describe("formatDistance", () => {
  it("위치 권한이 없으면 `-` 다 (8장)", () => {
    expect(formatDistance(null)).toBe("-");
  });

  it("1km 미만은 m 로, 이상은 소수 한 자리 km 로", () => {
    expect(formatDistance(0.42)).toBe("420m");
    expect(formatDistance(0.999)).toBe("999m");
    expect(formatDistance(1)).toBe("1.0km");
    expect(formatDistance(3.14)).toBe("3.1km");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-09-04T19:30:00+09:00");
  const before = (ms: number) => new Date(now.getTime() - ms).toISOString();

  const MINUTE = 60_000;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  it("구간마다 단위가 바뀐다 (10.2)", () => {
    expect(formatRelativeTime(before(30_000), now)).toBe("방금 전");
    expect(formatRelativeTime(before(5 * MINUTE), now)).toBe("5분 전");
    expect(formatRelativeTime(before(3 * HOUR), now)).toBe("3시간 전");
    expect(formatRelativeTime(before(2 * DAY), now)).toBe("2일 전");
  });

  it("경계에서 다음 단위로 넘어간다", () => {
    expect(formatRelativeTime(before(MINUTE - 1), now)).toBe("방금 전");
    expect(formatRelativeTime(before(MINUTE), now)).toBe("1분 전");
    expect(formatRelativeTime(before(HOUR), now)).toBe("1시간 전");
    expect(formatRelativeTime(before(DAY), now)).toBe("1일 전");
  });

  it("7일이 넘으면 절대 날짜로 떨어뜨린다 — `32일 전` 은 읽기 어렵다", () => {
    expect(formatRelativeTime(before(7 * DAY - 1), now)).toBe("6일 전");
    expect(formatRelativeTime(before(7 * DAY), now)).toBe("8/28(금)");
  });
});
