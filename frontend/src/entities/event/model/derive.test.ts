import { describe, expect, it } from "vitest";
import {
  currentTimeSlot,
  deriveScale,
  isEligible,
  isOpen,
  isThisWeek,
  isTodayKst,
  marksIneligible,
  priceFor,
  weekRangeKst,
} from "./derive";

describe("deriveScale", () => {
  // 남녀 동수가 원칙이다. 6.4 의 `5:5` / `6:6~9:9` / `10:10` 경계를 그대로 본다.
  it("한쪽 5명 이하는 소수정예다", () => {
    expect(deriveScale(4, 4)).toBe("SMALL");
    expect(deriveScale(5, 5)).toBe("SMALL");
  });

  it("한쪽 6~9명은 표준이다", () => {
    expect(deriveScale(6, 6)).toBe("STANDARD");
    expect(deriveScale(9, 9)).toBe("STANDARD");
  });

  it("한쪽 10명 이상은 대규모다", () => {
    expect(deriveScale(10, 10)).toBe("LARGE");
    expect(deriveScale(15, 15)).toBe("LARGE");
  });

  it("비대칭 정원이 들어와도 큰 쪽으로 판정한다", () => {
    // 예외 처리 경로다. 합계로 봤다면 10:4(=14)를 표준으로 잘못 읽는다
    expect(deriveScale(10, 4)).toBe("LARGE");
    expect(deriveScale(4, 10)).toBe("LARGE");
    expect(deriveScale(6, 2)).toBe("STANDARD");
  });
});

describe("weekRangeKst", () => {
  it("KST 월요일 00:00부터 일요일 23:59:59.999까지다", () => {
    // 2026-09-02(수) 정오 → 이번 주는 8/31(월)~9/6(일)
    const { start, end } = weekRangeKst(new Date("2026-09-02T12:00:00+09:00"));

    expect(new Date(start).toISOString()).toBe("2026-08-30T15:00:00.000Z"); // 8/31 00:00 KST
    expect(new Date(end).toISOString()).toBe("2026-09-06T14:59:59.999Z"); // 9/6 23:59:59.999 KST
  });

  it("실행 환경 타임존이 아니라 KST 달력으로 주를 자른다", () => {
    // UTC로는 9/6(일)이지만 KST로는 이미 9/7(월) 07:00 — 다음 주로 넘어가 있어야 한다
    const { start } = weekRangeKst(new Date("2026-09-06T22:00:00Z"));

    expect(new Date(start).toISOString()).toBe("2026-09-06T15:00:00.000Z"); // 9/7 00:00 KST
  });

  /*
   * 아래 두 케이스는 **CI 의 타임존 매트릭스와 짝**이다(.github/workflows/ci.yml).
   *
   * 구현이 `getUTCDay()` 대신 `getDay()` 같은 로컬 TZ API 를 한 줄이라도 쓰면
   * 서버(UTC)와 브라우저(KST 등)가 서로 다른 주를 계산하고, `when=THIS_WEEK`
   * 결과에서 소개팅이 통째로 사라진다. 그런데 그 회귀는 **어떤 시각을 넣느냐에
   * 따라 드러나기도 하고 안 드러나기도 한다** — 위 케이스들은 KST·UTC·PT 어디서
   * 읽어도 요일이 같아서 잡지 못한다.
   *
   * 그래서 "+9h 한 값을 로컬로 읽으면 요일이 갈리는" 순간을 골라 고정했다.
   * 각 케이스는 특정 오프셋 대역에서만 실패하므로 CI 가 그 대역의 TZ 로도 돌린다.
   */
  it("음수 오프셋 환경에서 요일이 밀려도 KST 주를 유지한다", () => {
    // now = 9/7(월) 05:00 KST. +9h 한 값을 미주 시간대로 읽으면 9/6(일)로 밀린다
    const { start, end } = weekRangeKst(new Date("2026-09-06T20:00:00Z"));

    expect(new Date(start).toISOString()).toBe("2026-09-06T15:00:00.000Z"); // 9/7(월) 00:00 KST
    expect(new Date(end).toISOString()).toBe("2026-09-13T14:59:59.999Z"); // 9/13(일) 23:59:59.999 KST
  });

  it("+14 오프셋 환경에서 요일이 앞서가도 KST 주를 유지한다", () => {
    // now = 9/6(일) 14:00 KST. +9h 한 값을 UTC+14 로 읽으면 9/7(월)로 앞서간다
    const { start, end } = weekRangeKst(new Date("2026-09-06T05:00:00Z"));

    expect(new Date(start).toISOString()).toBe("2026-08-30T15:00:00.000Z"); // 8/31(월) 00:00 KST
    expect(new Date(end).toISOString()).toBe("2026-09-06T14:59:59.999Z"); // 9/6(일) 23:59:59.999 KST
  });
});

describe("isThisWeek", () => {
  const now = new Date("2026-09-02T12:00:00+09:00");

  it("이번 주 개최 건만 참이다", () => {
    expect(isThisWeek("2026-09-04T19:30:00+09:00", now)).toBe(true);
    expect(isThisWeek("2026-09-06T23:59:59+09:00", now)).toBe(true);
    expect(isThisWeek("2026-09-12T11:00:00+09:00", now)).toBe(false);
  });

  it("주의 양끝 경계를 포함한다", () => {
    expect(isThisWeek("2026-08-31T00:00:00+09:00", now)).toBe(true);
    expect(isThisWeek("2026-08-30T23:59:59+09:00", now)).toBe(false);
    expect(isThisWeek("2026-09-07T00:00:00+09:00", now)).toBe(false);
  });
});

/**
 * 4.2 의 `오늘 저녁 N건 · 심야 N건` 이 세는 축이다.
 *
 * **KST 달력 날짜**로 판정한다 — 실행 환경의 타임존을 읽으면 UTC 로는 통과하고
 * `America/Los_Angeles` 에서만 하루 어긋난다. CI 가 TZ 2종으로 한 번 더 돈다.
 */
describe("isTodayKst", () => {
  const now = new Date("2026-09-10T12:00:00+09:00");

  it("같은 KST 날짜면 시각과 무관하게 오늘이다", () => {
    expect(isTodayKst("2026-09-10T00:00:00+09:00", now)).toBe(true);
    expect(isTodayKst("2026-09-10T23:59:59+09:00", now)).toBe(true);
  });

  it("어제·내일은 오늘이 아니다", () => {
    expect(isTodayKst("2026-09-09T23:59:59+09:00", now)).toBe(false);
    expect(isTodayKst("2026-09-11T00:00:00+09:00", now)).toBe(false);
  });

  it("이미 지난 시각도 오늘이면 오늘이다 — 남은 시간이 아니라 날짜를 센다", () => {
    // 4.2 가 세는 것은 `아직 갈 수 있는` 이 아니라 `오늘 열리는` 회차다
    expect(isTodayKst("2026-09-10T09:00:00+09:00", now)).toBe(true);
  });

  it("KST 자정 경계는 UTC 가 아니라 KST 로 갈린다", () => {
    // 2026-09-10 15:00Z = KST 로 9/11 00:00. UTC 로 세면 둘 다 9/10 이라 통과한다
    expect(isTodayKst("2026-09-10T14:59:59Z", now)).toBe(true);
    expect(isTodayKst("2026-09-10T15:00:00Z", now)).toBe(false);
  });

  it("`now` 쪽 경계도 KST 로 읽는다", () => {
    const justAfterMidnightKst = new Date("2026-09-10T15:00:00Z");
    expect(isTodayKst("2026-09-11T09:00:00+09:00", justAfterMidnightKst)).toBe(true);
    expect(isTodayKst("2026-09-10T23:00:00+09:00", justAfterMidnightKst)).toBe(false);
  });
});

describe("priceFor", () => {
  const priced = { malePrice: 45000, femalePrice: 35000 };

  it("성별 기준값을 고른다", () => {
    expect(priceFor(priced, "F")).toBe(35000);
    expect(priceFor(priced, "M")).toBe(45000);
  });

  it("가격 미확인 건은 null 을 그대로 돌려준다", () => {
    expect(priceFor({ malePrice: null, femalePrice: null }, "F")).toBeNull();
  });
});

describe("isEligible", () => {
  const event = {
    birthYearFrom: 1990,
    birthYearTo: 1996,
    maleCapacity: 7,
    femaleCapacity: 7,
  };

  it("출생연도가 모집 범위에 들면 통과한다", () => {
    expect(isEligible(event, { birthYear: 1993, gender: "F" })).toBe(true);
  });

  it("범위 양끝은 포함이다", () => {
    expect(isEligible(event, { birthYear: 1990, gender: "F" })).toBe(true);
    expect(isEligible(event, { birthYear: 1996, gender: "F" })).toBe(true);
  });

  it("범위 밖이면 탈락한다", () => {
    expect(isEligible(event, { birthYear: 1989, gender: "F" })).toBe(false);
    expect(isEligible(event, { birthYear: 1997, gender: "F" })).toBe(false);
  });

  it("내 성별 정원이 0이면 탈락한다", () => {
    const maleOnly = { ...event, femaleCapacity: 0 };
    expect(isEligible(maleOnly, { birthYear: 1993, gender: "F" })).toBe(false);
    // 상대 성별 정원이 0인 것은 내 자격과 무관하다
    expect(isEligible(maleOnly, { birthYear: 1993, gender: "M" })).toBe(true);
  });
});

/**
 * `내 나이대 아님` 표시 규칙 (6.4 / 6.5).
 *
 * 화면에서는 아직 확인되지 않는다 — `viewer` 가 P2-4 까지 `null` 이라 배지가 뜨는
 * 경로를 브라우저로 밟을 수 없다. 그래서 여기서 규칙만 못 박아 둔다.
 */
describe("marksIneligible", () => {
  const event = {
    birthYearFrom: 1990,
    birthYearTo: 1996,
    maleCapacity: 7,
    femaleCapacity: 7,
  };
  const inRange = { birthYear: 1993, gender: "F" } as const;
  const outOfRange = { birthYear: 1999, gender: "F" } as const;

  it("자격 필터를 끈 상태에서 자격 밖이면 표시한다", () => {
    expect(marksIneligible(event, outOfRange, false)).toBe(true);
  });

  it("자격이 있으면 표시하지 않는다", () => {
    expect(marksIneligible(event, inRange, false)).toBe(false);
  });

  it("자격 필터가 켜져 있으면 표시하지 않는다", () => {
    // 남은 건이 전부 자격을 만족해 늘 같은 값이 된다 (`decisions.md` 4.23 과 같은 이유)
    expect(marksIneligible(event, outOfRange, true)).toBe(false);
  });

  it("게스트에게는 표시하지 않는다 — 자격을 판정할 근거가 없다", () => {
    expect(marksIneligible(event, null, false)).toBe(false);
    // 게스트는 축 자체가 없어 `undefined` 로 온다 (6.1)
    expect(marksIneligible(event, null, undefined)).toBe(false);
  });

  it("축이 없으면(`undefined`) 표시하지 않는다", () => {
    expect(marksIneligible(event, outOfRange, undefined)).toBe(false);
  });

  it("정원이 0이라 못 가는 경우도 같은 표시를 받는다", () => {
    // `참가 불가` 를 쓰지 않는 이유다 — 나이가 맞아도 자리가 없을 수 있다 (6.4)
    const maleOnly = { ...event, femaleCapacity: 0 };
    expect(marksIneligible(maleOnly, inRange, false)).toBe(true);
  });
});

describe("currentTimeSlot", () => {
  // 경계는 시작 시각 기준이다 — 12:00 은 오후, 21:00 은 심야 (6.2)
  it("경계 시각은 다음 슬롯에 속한다", () => {
    expect(currentTimeSlot(new Date("2026-09-02T11:59:59+09:00"))).toBe("MORNING");
    expect(currentTimeSlot(new Date("2026-09-02T12:00:00+09:00"))).toBe("AFTERNOON");
    expect(currentTimeSlot(new Date("2026-09-02T16:59:59+09:00"))).toBe("AFTERNOON");
    expect(currentTimeSlot(new Date("2026-09-02T17:00:00+09:00"))).toBe("DINNER");
    expect(currentTimeSlot(new Date("2026-09-02T20:59:59+09:00"))).toBe("DINNER");
    expect(currentTimeSlot(new Date("2026-09-02T21:00:00+09:00"))).toBe("LATE_NIGHT");
  });

  it("자정을 넘기면 오전으로 돌아온다", () => {
    expect(currentTimeSlot(new Date("2026-09-02T23:59:59+09:00"))).toBe("LATE_NIGHT");
    expect(currentTimeSlot(new Date("2026-09-03T00:00:00+09:00"))).toBe("MORNING");
  });

  it("실행 환경 타임존이 아니라 KST 시각으로 판정한다", () => {
    // UTC 로는 10:00(오전)이지만 KST 로는 19:00 — 디너다
    expect(currentTimeSlot(new Date("2026-09-02T10:00:00Z"))).toBe("DINNER");
  });
});

describe("isOpen", () => {
  it("`신청 가능` 만 모집 중이다", () => {
    expect(isOpen({ status: "신청 가능" })).toBe(true);
    expect(isOpen({ status: "마감" })).toBe(false);
  });
});
