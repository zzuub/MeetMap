import { describe, expect, it } from "vitest";
import { MOCK_EVENTS } from "../mock/events";
import { MOCK_VIEWER } from "../mock/viewer";
import { deriveScale, isThisWeek } from "../model/derive";
import type { EventListQuery } from "../model/types";
import { applyFilters, mockEventApi } from "./eventApi.mock";

/**
 * 목 필터는 **기능정의서 6.1/6.4 의 필터 의미**를 코드로 적어둔 자리다.
 * 실 서버가 나중에 같은 규칙을 구현해야 하므로 규칙 하나하나를 못박아 둔다.
 *
 * `applyFilters` 를 직접 부른다 — `getList` 를 거치면 케이스마다 목 지연(300ms)이
 * 붙어 테스트가 느려진다. 지연·페이지네이션은 아래 `getList` 블록에서 따로 본다.
 */
const ids = (query: EventListQuery) =>
  applyFilters(MOCK_EVENTS, query).map((event) => event.id);

describe("목 데이터 자체의 무결성", () => {
  it("8건이다", () => {
    expect(MOCK_EVENTS).toHaveLength(8);
  });

  it("남녀 정원이 동수다 (로테이션 소개팅의 전제)", () => {
    for (const event of MOCK_EVENTS) {
      expect(event.maleCapacity).toBe(event.femaleCapacity);
      expect(event.maleCapacity).toBeGreaterThan(0);
    }
  });

  it("`scale` 이 정원과 어긋나지 않는다", () => {
    for (const event of MOCK_EVENTS) {
      expect(event.scale).toBe(deriveScale(event.maleCapacity, event.femaleCapacity));
    }
  });

  it("`stationName` 은 locationPrecision 이 STATION 일 때만 채워져 있다", () => {
    for (const event of MOCK_EVENTS) {
      expect(event.stationName === null).toBe(event.locationPrecision !== "STATION");
    }
  });

  it("`venueName`·`address` 는 locationPrecision 이 EXACT 일 때만 채워져 있다", () => {
    for (const event of MOCK_EVENTS) {
      const exact = event.locationPrecision === "EXACT";
      expect(event.venueName !== null).toBe(exact);
      expect(event.address !== null).toBe(exact);
    }
  });

  it("화면이 마주쳐야 할 경계값이 섞여 있다", () => {
    expect(MOCK_EVENTS.some((e) => e.malePrice === null && e.femalePrice === null)).toBe(true);
    expect(MOCK_EVENTS.some((e) => e.reviewCount === 0)).toBe(true);
    expect(MOCK_EVENTS.some((e) => e.status === "마감")).toBe(true);

    const precisions = new Set(MOCK_EVENTS.map((e) => e.locationPrecision));
    expect(precisions).toEqual(new Set(["EXACT", "STATION", "DISTRICT"]));

    const slots = new Set(MOCK_EVENTS.map((e) => e.timeSlot));
    expect(slots).toEqual(new Set(["MORNING", "AFTERNOON", "DINNER", "LATE_NIGHT"]));

    const scales = new Set(MOCK_EVENTS.map((e) => e.scale));
    expect(scales).toEqual(new Set(["SMALL", "STANDARD", "LARGE"]));
  });
});

describe("applyFilters", () => {
  it("빈 쿼리는 전건을 통과시킨다", () => {
    expect(ids({})).toHaveLength(MOCK_EVENTS.length);
  });

  it("district 는 구 단위로 거르고 ALL 은 전지역이다", () => {
    expect(ids({ district: "MAPO" })).toEqual(["evt-003"]);
    expect(ids({ district: "ALL" })).toHaveLength(MOCK_EVENTS.length);
  });

  it("slot 은 단일 시간대로 거른다", () => {
    expect(ids({ slot: "MORNING" })).toEqual(["evt-005"]);
    expect(ids({ slot: "LATE_NIGHT" })).toEqual(["evt-003"]);
    expect(ids({ slot: "ALL" })).toHaveLength(MOCK_EVENTS.length);
  });

  it("when 은 이번 주와 그 이후로 전건을 두 조각으로 나눈다", () => {
    const thisWeek = ids({ when: "THIS_WEEK" });
    const later = ids({ when: "LATER" });

    expect(thisWeek.length + later.length).toBe(MOCK_EVENTS.length);
    expect(thisWeek.filter((id) => later.includes(id))).toEqual([]);
    // 목 데이터는 양쪽 다 결과가 나오게 짜여 있다 (기준일 2026-09-02)
    expect(thisWeek.length).toBeGreaterThan(0);
    expect(later.length).toBeGreaterThan(0);
    for (const id of thisWeek) {
      expect(isThisWeek(MOCK_EVENTS.find((e) => e.id === id)!.date)).toBe(true);
    }
  });

  it("scale 은 규모로 거른다", () => {
    expect(ids({ scale: "SMALL" })).toEqual(["evt-004", "evt-008"]);
    expect(ids({ scale: "LARGE" })).toEqual(["evt-002", "evt-003"]);
  });

  it("status=OPEN 은 마감 건을 뺀다", () => {
    const open = ids({ status: "OPEN" });
    expect(open).not.toContain("evt-007");
    expect(open).toHaveLength(MOCK_EVENTS.length - 1);
  });

  it("mood 다중 선택은 OR 조건이다", () => {
    const calm = ids({ mood: ["차분한"] });
    const active = ids({ mood: ["활동적인"] });
    const both = ids({ mood: ["차분한", "활동적인"] });

    expect(both).toEqual(expect.arrayContaining([...calm, ...active]));
    expect(both.length).toBe(new Set([...calm, ...active]).size);
    expect(both.length).toBeGreaterThan(calm.length);
  });

  it("maxPrice 는 사용자 성별 기준값과 비교한다", () => {
    // MOCK_VIEWER 는 여성이므로 femalePrice 축이다
    expect(MOCK_VIEWER.gender).toBe("F");

    const cheap = applyFilters(MOCK_EVENTS, { maxPrice: 30000 });
    expect(cheap.length).toBeGreaterThan(0);
    for (const event of cheap) {
      expect(event.femalePrice).not.toBeNull();
      expect(event.femalePrice!).toBeLessThanOrEqual(30000);
    }
    // 남성 기준이었다면 통과했을 건이 걸러진다 (evt-006: 남 33,000 / 여 25,000)
    expect(cheap.map((e) => e.id)).toContain("evt-006");
  });

  it("가격 미확인 건은 maxPrice 필터에서 빠진다", () => {
    expect(ids({ maxPrice: 70000 })).not.toContain("evt-004");
    expect(ids({})).toContain("evt-004");
  });

  it("eligibleOnly 는 출생연도 범위 밖 건을 뺀다", () => {
    const eligible = applyFilters(MOCK_EVENTS, { eligibleOnly: true });

    expect(eligible.length).toBeGreaterThan(0);
    expect(eligible.length).toBeLessThan(MOCK_EVENTS.length);
    for (const event of eligible) {
      expect(MOCK_VIEWER.birthYear).toBeGreaterThanOrEqual(event.birthYearFrom);
      expect(MOCK_VIEWER.birthYear).toBeLessThanOrEqual(event.birthYearTo);
    }
  });

  it("조건을 겹쳐 걸면 AND 로 좁힌다", () => {
    expect(ids({ when: "THIS_WEEK", status: "OPEN", scale: "SMALL" })).toEqual([
      "evt-004",
    ]);
  });
});

describe("mockEventApi", () => {
  it("getList 는 정렬 후 커서 페이지로 자른다", async () => {
    const first = await mockEventApi.getList({ limit: 3 });

    expect(first.items).toHaveLength(3);
    expect(first.totalCount).toBe(MOCK_EVENTS.length);
    expect(first.nextCursor).not.toBeNull();
    // 기본 정렬은 인기순이다
    expect(first.items.map((e) => e.id)).toEqual(["evt-002", "evt-007", "evt-001"]);

    const second = await mockEventApi.getList({ limit: 3, cursor: first.nextCursor });
    expect(second.items.map((e) => e.id)).not.toContain("evt-002");
  });

  it("가격 정렬은 성별 기준값을 쓰고 가격 미확인 건을 뒤로 보낸다", async () => {
    const asc = await mockEventApi.getList({ sort: "priceAsc", limit: 20 });
    const prices = asc.items.map((e) => e.femalePrice);

    expect(prices.at(-1)).toBeNull();
    const known = prices.filter((p): p is number => p !== null);
    expect(known).toEqual([...known].sort((a, b) => a - b));

    const desc = await mockEventApi.getList({ sort: "priceDesc", limit: 20 });
    expect(desc.items.at(-1)?.femalePrice).toBeNull();
    expect(desc.items[0]?.femalePrice).toBe(39000);
  });

  it("getHomeFeed 의 세 섹션이 각자의 규칙을 지킨다", async () => {
    const feed = await mockEventApi.getHomeFeed({});

    // 이번 주 인기 — 이번 주 개최 + popularity 내림차순
    expect(feed.weeklyPopular.length).toBeGreaterThan(0);
    for (const event of feed.weeklyPopular) expect(isThisWeek(event.date)).toBe(true);
    const pop = feed.weeklyPopular.map((e) => e.popularity);
    expect(pop).toEqual([...pop].sort((a, b) => b - a));

    // 내 나이대 — 출생연도 범위 안
    expect(feed.myAgeGroup.length).toBeGreaterThan(0);
    for (const event of feed.myAgeGroup) {
      expect(MOCK_VIEWER.birthYear).toBeGreaterThanOrEqual(event.birthYearFrom);
      expect(MOCK_VIEWER.birthYear).toBeLessThanOrEqual(event.birthYearTo);
    }

    // 새로 등록된 — createdAt 내림차순, 최대 4건
    expect(feed.newlyAdded).toHaveLength(4);
    const created = feed.newlyAdded.map((e) => e.createdAt);
    expect(created).toEqual([...created].sort().reverse());
    expect(feed.newlyAdded[0].id).toBe("evt-006");
  });

  it("검색은 소개팅명·지역·주최사를 본다", async () => {
    expect((await mockEventApi.search("성수")).map((e) => e.id)).toContain("evt-001");
    expect((await mockEventApi.search("로테이션서울")).map((e) => e.id)).toEqual([
      "evt-001",
      "evt-007",
    ]);
    expect(await mockEventApi.search("   ")).toEqual([]);
  });

  it("없는 id 는 404 ApiError 로 떨어진다", async () => {
    await expect(mockEventApi.getDetail("nope")).rejects.toMatchObject({
      status: 404,
    });
  });
});
