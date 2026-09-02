import { describe, expect, it } from "vitest";
import { deriveScale, isEligible, isThisWeek, priceFor, weekRangeKst } from "./derive";

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
