import { describe, expect, it } from "vitest";
import { MOOD_TAGS, PRICE_CAPS } from "@/shared/config";
import {
  parseExploreParams,
  serializeExploreParams,
  type RawSearchParams,
} from "./exploreParams";

/**
 * URL 이 필터 상태의 원본이므로(2.4) 이 변환이 탐색 화면의 계약이다.
 * 값을 하나하나 나열하지 않고 **규칙**을 본다 — 마스터가 늘어도 안 깨지도록.
 */
const asUser = (params: RawSearchParams) => parseExploreParams(params, { isGuest: false });
const asGuest = (params: RawSearchParams) => parseExploreParams(params, { isGuest: true });

describe("parseExploreParams", () => {
  it("빈 쿼리는 기본값이다", () => {
    const { view, query } = asUser({});

    expect(view).toBe("list");
    expect(query.district).toBe("ALL");
    expect(query.when).toBe("ALL");
    expect(query.slot).toBe("ALL");
    expect(query.scale).toBe("ALL");
    expect(query.status).toBe("ALL");
    expect(query.sort).toBe("popular");
    expect(query.mood).toBeUndefined();
  });

  it("알 수 없는 값은 기본값으로 떨어진다", () => {
    // URL 은 손으로 고칠 수 있다. 오타 하나로 빈 화면을 주지 않는다 (6.1)
    const { view, query } = asUser({
      view: "globe",
      district: "PARIS",
      when: "TOMORROW",
      slot: "BRUNCH",
      scale: "HUGE",
      sort: "cheap",
      status: "SOLD_OUT",
    });

    expect(view).toBe("list");
    expect(query.district).toBe("ALL");
    expect(query.when).toBe("ALL");
    expect(query.slot).toBe("ALL");
    expect(query.scale).toBe("ALL");
    expect(query.sort).toBe("popular");
    expect(query.status).toBe("ALL");
  });

  it("마스터에 있는 값은 그대로 통과시킨다", () => {
    const { view, query } = asUser({
      view: "map",
      district: "MAPO",
      when: "THIS_WEEK",
      slot: "LATE_NIGHT",
      scale: "SMALL",
      sort: "rating",
      status: "OPEN",
      area: "성수·건대",
    });

    expect(view).toBe("map");
    expect(query.district).toBe("MAPO");
    expect(query.when).toBe("THIS_WEEK");
    expect(query.slot).toBe("LATE_NIGHT");
    expect(query.scale).toBe("SMALL");
    expect(query.sort).toBe("rating");
    expect(query.status).toBe("OPEN");
    expect(query.area).toBe("성수·건대");
  });

  it("mood 는 콤마로 나누고 마스터에 없는 태그는 버린다", () => {
    const known = MOOD_TAGS[0];

    expect(asUser({ mood: `${known},고양이` }).query.mood).toEqual([known]);
    expect(asUser({ mood: "고양이" }).query.mood).toBeUndefined();
    expect(asUser({ mood: `${known},${known}` }).query.mood).toEqual([known]);
    expect(asUser({ mood: ` ${known} ` }).query.mood).toEqual([known]);
  });

  it("maxPrice 는 가격 상한 칩에 있는 값만 받는다", () => {
    // 임의 숫자를 받으면 필터 시트가 아무 칩도 선택 못 한 상태로 뜬다 (6.1)
    const cap = PRICE_CAPS[0].value;

    expect(asUser({ maxPrice: String(cap) }).query.maxPrice).toBe(cap);
    expect(asUser({ maxPrice: "33000" }).query.maxPrice).toBeUndefined();
    expect(asUser({ maxPrice: "abc" }).query.maxPrice).toBeUndefined();
  });

  it("eligibleOnly 는 부재가 기본 ON 이고 `0` 만 OFF 다", () => {
    // 기본이 ON 이라 "없으면 꺼짐"으로 읽으면 기본값을 표현할 수 없다 (6.1)
    expect(asUser({}).query.eligibleOnly).toBe(true);
    expect(asUser({ eligibleOnly: "1" }).query.eligibleOnly).toBe(true);
    expect(asUser({ eligibleOnly: "0" }).query.eligibleOnly).toBe(false);
  });

  it("게스트에게는 인증 주체가 필요한 축을 아예 만들지 않는다", () => {
    // 손으로 파라미터를 붙여도 무시돼야 한다 (6.1)
    const { query } = asGuest({ eligibleOnly: "1", maxPrice: String(PRICE_CAPS[0].value) });

    expect(query.eligibleOnly).toBeUndefined();
    expect(query.maxPrice).toBeUndefined();
    // 나머지 축은 게스트에게도 그대로 걸린다
    expect(asGuest({ slot: "DINNER" }).query.slot).toBe("DINNER");
  });

  it("같은 키가 두 번 오면 첫 값을 쓴다", () => {
    expect(asUser({ slot: ["DINNER", "MORNING"] }).query.slot).toBe("DINNER");
  });
});

describe("serializeExploreParams", () => {
  const roundTrip = (params: RawSearchParams) =>
    serializeExploreParams(asUser(params));

  it("기본값은 싣지 않는다", () => {
    // URL 은 공유·북마크된다. 무엇이 실제로 걸린 조건인지 눈으로 읽혀야 한다
    expect(roundTrip({})).toBe("");
  });

  it("걸린 조건만 싣는다", () => {
    const search = new URLSearchParams(
      roundTrip({ district: "MAPO", slot: "DINNER", sort: "latest" }),
    );

    expect([...search.keys()].sort()).toEqual(["district", "slot", "sort"]);
    expect(search.get("district")).toBe("MAPO");
  });

  it("파싱 → 직렬화 → 파싱이 같은 결과를 낸다", () => {
    const original: RawSearchParams = {
      view: "map",
      district: "SEONGDONG",
      when: "LATER",
      slot: "MORNING",
      scale: "LARGE",
      status: "OPEN",
      sort: "priceAsc",
      mood: MOOD_TAGS[1],
      area: "잠실·송파",
      maxPrice: String(PRICE_CAPS[2].value),
      eligibleOnly: "0",
    };

    const once = asUser(original);
    const twice = parseExploreParams(
      Object.fromEntries(new URLSearchParams(serializeExploreParams(once))),
      { isGuest: false },
    );

    expect(twice).toEqual(once);
  });

  it("자격 OFF 는 지우지 않고 `0` 으로 남긴다", () => {
    // 지우면 기본값(ON)으로 되돌아가 칩이 다시 살아난다 (6.2 칩 줄의 ✕)
    expect(roundTrip({ eligibleOnly: "0" })).toBe("eligibleOnly=0");
    expect(roundTrip({ eligibleOnly: "1" })).toBe("");
  });
});
