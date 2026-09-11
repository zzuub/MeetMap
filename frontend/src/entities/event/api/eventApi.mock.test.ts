import { describe, expect, it } from "vitest";
import { PRICE_CAPS } from "@/shared/config";
import { getMockEvents, mockProviderRatingScore } from "../mock/events";
import { MOCK_VIEWER } from "../mock/viewer";
import {
  currentTimeSlot,
  deriveScale,
  isEligible,
  isOpen,
  isThisWeek,
  priceFor,
} from "../model/derive";
import type { EventListQuery } from "../model/types";
import { applyFilters, applySort, mockEventApi } from "./eventApi.mock";

// 테스트 한 번 도는 동안 주가 바뀌지 않으므로 목 API 가 보는 것과 같은 배열이다
const MOCK_EVENTS = getMockEvents();

/**
 * 목 필터는 **기능정의서 6.1/6.4 의 필터 의미**를 코드로 적어둔 자리다.
 * 실 서버가 나중에 같은 규칙을 구현해야 하므로 규칙 하나하나를 못박아 둔다.
 *
 * `applyFilters` 를 직접 부른다 — `getList` 를 거치면 케이스마다 목 지연(300ms)이
 * 붙어 테스트가 느려진다. 지연·페이지네이션은 아래 `getList` 블록에서 따로 본다.
 */
const ids = (query: EventListQuery) =>
  applyFilters(MOCK_EVENTS, query).map((event) => event.id);

/**
 * 필터 결과를 **성질로** 단언한다.
 *
 * id 를 나열하면(`toEqual(["evt-003"])`) 목 데이터를 한 줄만 고쳐도 무관한
 * 테스트가 깨진다. 여기서 확인할 것은 "어떤 건이 남았나"가 아니라 **규칙이
 * 지켜졌나**다 — 남은 건이 전부 조건을 만족하고, 조건을 만족하는 건이 하나도
 * 빠지지 않았는가.
 */
function expectFilterMatches(
  query: EventListQuery,
  predicate: (event: (typeof MOCK_EVENTS)[number]) => boolean,
) {
  const actual = applyFilters(MOCK_EVENTS, query);
  const expected = MOCK_EVENTS.filter(predicate);

  expect(expected.length, "이 조건을 만족하는 목 데이터가 없다").toBeGreaterThan(0);
  expect(actual.map((e) => e.id).sort()).toEqual(expected.map((e) => e.id).sort());
}

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
    expect(MOCK_EVENTS.some((e) => e.thumbnailUrl === null)).toBe(true);
    expect(MOCK_EVENTS.some((e) => e.status === "마감")).toBe(true);

    const precisions = new Set(MOCK_EVENTS.map((e) => e.locationPrecision));
    expect(precisions).toEqual(new Set(["EXACT", "STATION", "DISTRICT"]));

    const slots = new Set(MOCK_EVENTS.map((e) => e.timeSlot));
    expect(slots).toEqual(new Set(["MORNING", "AFTERNOON", "DINNER", "LATE_NIGHT"]));

    const scales = new Set(MOCK_EVENTS.map((e) => e.scale));
    expect(scales).toEqual(new Set(["SMALL", "STANDARD", "LARGE"]));
  });

  it("주최사 4곳에 회차가 2건씩 붙는다", () => {
    // 회차마다 주최사가 다르면 주최사 단위 집계를 화면에서 검증할 수 없다 —
    // 평점 요약도 `진행 중인 소개팅` 목록도 늘 1건짜리가 된다 (7.4)
    const byProvider = new Map<string, number>();
    for (const event of MOCK_EVENTS) {
      byProvider.set(event.provider.id, (byProvider.get(event.provider.id) ?? 0) + 1);
    }

    expect(byProvider.size).toBe(4);
    for (const count of byProvider.values()) expect(count).toBe(2);
  });

  it("이미지 사용 동의는 회차가 아니라 주최사 단위다", () => {
    // 같은 주최사인데 어떤 회차는 사진이 있고 어떤 회차는 없으면 모순이다 (7.2)
    const consent = new Map<string, boolean>();
    for (const event of MOCK_EVENTS) {
      const has = event.thumbnailUrl !== null;
      const seen = consent.get(event.provider.id);
      if (seen === undefined) consent.set(event.provider.id, has);
      else expect(has).toBe(seen);
    }

    // 동의하지 않은 주최사가 실제로 하나 있어야 대체 표시를 볼 수 있다
    expect([...consent.values()]).toContain(false);
  });

  it("timeSlot 이 개최 시각과 어긋나지 않는다", () => {
    // `timeSlot` 은 저장 필드지만 경계는 **시작 시각** 기준으로 정의돼 있다 (6.2).
    // 날짜가 상대값이 되면서 시각 계산이 생겼으니, 계산이 틀어지면 카드의 `디너`
    // 배지와 `10:30` 이 같이 뜨는 모순을 여기서 잡는다 (`decisions.md` 4.31)
    for (const event of MOCK_EVENTS) {
      expect(currentTimeSlot(new Date(event.date)), `${event.id} 의 시간대`).toBe(
        event.timeSlot,
      );
    }
  });

  it("등록일은 언제 돌려도 과거다", () => {
    // 개최일은 미래(이번 주 후반~2주 뒤)인데 등록일 일수가 양수로 바뀌면 **아직
    // 등록되지 않은 소개팅**이 목록에 뜬다. 날짜가 상대값이 되면서 부호 하나로
    // 생기는 실수라 여기서 잠근다 (`decisions.md` 4.31)
    const now = Date.now();

    for (const event of MOCK_EVENTS) {
      expect(new Date(event.createdAt).getTime(), `${event.id} 의 등록일`).toBeLessThan(now);
      expect(new Date(event.createdAt).getTime()).toBeLessThan(new Date(event.date).getTime());
    }
  });

  it("정렬 축에 동률이 없다", () => {
    // 동률이 생기면 `Array.sort` 의 안정성만으로 정렬 테스트가 통과해버려
    // 비교 함수의 버그를 못 잡는다. `sort=rating` 이 실제로 그랬다 —
    // 같은 주최사 회차끼리 점수가 같아 2차 정렬 검증에 뒤집기가 필요했다.
    // 여기가 깨지면 해당 정렬 테스트에도 뒤집기를 적용해야 한다.
    const axes: Record<string, (string | number)[]> = {
      createdAt: MOCK_EVENTS.map((e) => e.createdAt),
      femalePrice: MOCK_EVENTS.flatMap((e) => e.femalePrice ?? []),
      malePrice: MOCK_EVENTS.flatMap((e) => e.malePrice ?? []),
      popularity: MOCK_EVENTS.map((e) => e.popularity),
    };

    for (const [axis, values] of Object.entries(axes)) {
      expect(new Set(values).size, `${axis} 에 동률이 생겼다`).toBe(values.length);
    }
  });

  it("모집 중인 회차가 1건뿐인 주최사가 있다", () => {
    // 주최사 페이지(7.4)가 마감 회차를 거르는지 보려면 필요한 경계다
    const open = MOCK_EVENTS.filter((e) => e.status === "신청 가능");
    const counts = new Map<string, number>();
    for (const event of open) {
      counts.set(event.provider.id, (counts.get(event.provider.id) ?? 0) + 1);
    }

    expect([...counts.values()]).toContain(1);
  });
});

describe("applyFilters", () => {
  it("빈 쿼리는 전건을 통과시킨다", () => {
    expect(ids({})).toHaveLength(MOCK_EVENTS.length);
  });

  it("district 는 구 단위로 거르고 ALL 은 전지역이다", () => {
    expectFilterMatches({ district: "MAPO" }, (e) => e.district === "MAPO");
    expect(ids({ district: "ALL" })).toHaveLength(MOCK_EVENTS.length);
  });

  it("slot 은 단일 시간대로 거른다", () => {
    expectFilterMatches({ slot: "MORNING" }, (e) => e.timeSlot === "MORNING");
    expectFilterMatches({ slot: "LATE_NIGHT" }, (e) => e.timeSlot === "LATE_NIGHT");
    expect(ids({ slot: "ALL" })).toHaveLength(MOCK_EVENTS.length);
  });

  it("when 은 이번 주와 그 이후로 전건을 두 조각으로 나눈다", () => {
    const thisWeek = ids({ when: "THIS_WEEK" });
    const later = ids({ when: "LATER" });

    // 여기가 이 테스트의 값이다 — 전건이 정확히 한쪽에만 속한다(`LATER` 가
    // `!THIS_WEEK` 로 정의됐는가). 어느 건도 양쪽 다이거나 양쪽 다 아니면 걸린다
    expect(thisWeek.length + later.length).toBe(MOCK_EVENTS.length);
    expect(thisWeek.filter((id) => later.includes(id))).toEqual([]);

    // 5:3 은 **회귀 감지용 스냅샷**이다. 목 날짜가 `isThisWeek` 와 같은 앵커를 쓰므로
    // 언제 돌려도 같지만, 그건 자기 일관성이지 경계가 옳다는 증명이 아니다 —
    // 월 00:00~일 23:59:59.999 의 정확성은 `derive.test.ts` 가 고정된 `now` 와
    // 절대 ISO 로 따로 본다 (PR #27 리뷰)
    expect(thisWeek).toHaveLength(5);
    expect(later).toHaveLength(3);
  });

  it("scale 은 규모로 거른다", () => {
    expectFilterMatches({ scale: "SMALL" }, (e) => e.scale === "SMALL");
    expectFilterMatches({ scale: "LARGE" }, (e) => e.scale === "LARGE");
  });

  it("status=OPEN 은 마감 건을 뺀다", () => {
    expectFilterMatches({ status: "OPEN" }, (e) => e.status === "신청 가능");
    // 거르는 것이 실제로 있어야 이 테스트가 의미를 갖는다
    expect(MOCK_EVENTS.some((e) => e.status === "마감")).toBe(true);
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
    // 성별 축이 실제로 다른 답을 내는지 — 여성 기준으로만 통과하는 건이 있어야 한다
    const onlyByFemalePrice = MOCK_EVENTS.filter((e) => {
      const f = priceFor(e, "F");
      const m = priceFor(e, "M");
      return f !== null && f <= 30000 && (m === null || m > 30000);
    });
    expect(onlyByFemalePrice.length, "성별 축을 구분하는 목 데이터가 없다").toBeGreaterThan(0);
    expect(cheap.map((e) => e.id)).toEqual(
      expect.arrayContaining(onlyByFemalePrice.map((e) => e.id)),
    );
  });

  it("가격 상한 칩 3종이 각각 다른 건수를 낸다", () => {
    // 목 데이터에 5만원 초과 건이 없으면 5만·7만 칩이 같은 필터가 되어
    // 개발 중에 구별되지 않는다. 성별이 바뀌어도 유지돼야 하므로 양쪽 다 본다
    for (const gender of ["F", "M"] as const) {
      const counts = PRICE_CAPS.map(
        (cap) =>
          MOCK_EVENTS.filter((event) => {
            const price = priceFor(event, gender);
            return price !== null && price <= cap.value;
          }).length,
      );
      expect(new Set(counts).size, `${gender} 기준 상한별 건수: ${counts}`).toBe(
        PRICE_CAPS.length,
      );
    }
  });

  it("가격 미확인 건은 maxPrice 필터에서 빠진다", () => {
    const unpriced = MOCK_EVENTS.filter((e) => priceFor(e, MOCK_VIEWER.gender) === null);
    expect(unpriced.length, "가격 미확인 목 데이터가 없다").toBeGreaterThan(0);

    // 상한을 아무리 높여도 들어오지 않는다. "3만원 이하"에 가격 모르는 건을
    // 섞으면 필터가 거짓말이 된다
    const withCap = ids({ maxPrice: Number.MAX_SAFE_INTEGER });
    for (const event of unpriced) {
      expect(withCap).not.toContain(event.id);
      expect(ids({})).toContain(event.id);
    }
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
    expectFilterMatches(
      { when: "THIS_WEEK", status: "OPEN", scale: "SMALL" },
      (e) => isThisWeek(e.date) && e.status === "신청 가능" && e.scale === "SMALL",
    );
    // 한 축만 걸었을 때보다 실제로 좁아지는지 — AND 가 아니라 OR 였다면 넓어진다
    expect(ids({ when: "THIS_WEEK", status: "OPEN", scale: "SMALL" }).length).toBeLessThan(
      ids({ when: "THIS_WEEK" }).length,
    );
  });
});

describe("mockEventApi", () => {
  it("getList 는 정렬 후 커서 페이지로 자른다", async () => {
    const first = await mockEventApi.getList({ limit: 3 });

    expect(first.items).toHaveLength(3);
    expect(first.totalCount).toBe(MOCK_EVENTS.length);
    expect(first.nextCursor).not.toBeNull();
    // 기본 정렬은 인기순이다
    const byPopularity = [...MOCK_EVENTS].sort((a, b) => b.popularity - a.popularity);
    expect(first.items.map((e) => e.id)).toEqual(byPopularity.slice(0, 3).map((e) => e.id));

    // 다음 페이지는 앞 페이지와 겹치지 않는다
    const second = await mockEventApi.getList({ limit: 3, cursor: first.nextCursor });
    const firstIds = first.items.map((e) => e.id);
    expect(second.items.filter((e) => firstIds.includes(e.id))).toEqual([]);
  });

  it("최신순은 등록 시각 내림차순이다", async () => {
    // 개최일 임박순이 아니라 `createdAt` 기준이다 (5.3 '새로 등록된' 과 같은 축)
    const { items } = await mockEventApi.getList({ sort: "latest", limit: 20 });
    const created = items.map((e) => e.createdAt);

    expect(created).toEqual([...created].sort().reverse());
    expect(items).toHaveLength(MOCK_EVENTS.length);
  });

  it("가격 정렬은 성별 기준값을 쓰고 가격 미확인 건을 뒤로 보낸다", async () => {
    const asc = await mockEventApi.getList({ sort: "priceAsc", limit: 20 });
    const prices = asc.items.map((e) => e.femalePrice);

    expect(prices.at(-1)).toBeNull();
    const known = prices.filter((p): p is number => p !== null);
    expect(known).toEqual([...known].sort((a, b) => a - b));

    const desc = await mockEventApi.getList({ sort: "priceDesc", limit: 20 });
    expect(desc.items.at(-1)?.femalePrice).toBeNull();
    expect(desc.items[0]?.femalePrice).toBe(55000);
  });

  it("평점 정렬은 주최사 기준이고 같은 주최사의 회차가 붙어 나온다", async () => {
    const { items } = await mockEventApi.getList({ sort: "rating", limit: 20 });
    const order = items.map((e) => e.provider.id);

    // 보정값 내림차순이다. 어느 주최사가 1등인지는 목 데이터가 정할 일이고,
    // 여기서 지킬 것은 **정렬 키가 ratingScore 라는 계약**이다
    const scores = order.map(mockProviderRatingScore);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));

    // 정렬 키가 주최사 값이라 같은 주최사는 반드시 연속으로 붙는다.
    // (뭉침을 막는 상한은 아직 없다 — decisions.md 4.20)
    const runs = order.filter((id, i) => id !== order[i - 1]);
    expect(new Set(runs).size).toBe(runs.length);
  });

  // 보정식 자체의 성질(표본 적은 만점이 지는 것, 후기 0건이 중간에 놓이는 것)은
  // shared/lib/rating.test.ts 와 entities/provider 의 목 데이터 테스트가 덮는다.
  // 여기서는 이벤트 목록이 그 값을 정렬 키로 쓰는지만 본다.

  it("평점 정렬의 2차 정렬은 개최일 가까운 순이다", () => {
    // 목 데이터는 이미 개최일 순으로 적혀 있어 그대로 넣으면 안정 정렬이 규칙을
    // 가린다. 뒤집어 넣어야 2차 정렬이 실제로 도는지 알 수 있다.
    const reversed = [...MOCK_EVENTS].reverse();
    const sorted = applySort(reversed, "rating");

    for (let i = 1; i < sorted.length; i += 1) {
      if (sorted[i].provider.id !== sorted[i - 1].provider.id) continue;
      expect(sorted[i - 1].date.localeCompare(sorted[i].date)).toBeLessThanOrEqual(0);
    }

    // 뒤집어 넣었는데도 주최사별 묶음이 개최일 오름차순으로 되돌아왔는지
    const grouped = new Map<string, string[]>();
    for (const event of sorted) {
      grouped.set(event.provider.id, [...(grouped.get(event.provider.id) ?? []), event.date]);
    }
    for (const dates of grouped.values()) {
      expect(dates).toEqual([...dates].sort());
    }
  });

  it("providerId 로 주최사의 모집 중인 회차만 가져온다", async () => {
    // 주최사 페이지(7.4)의 `진행 중인 소개팅` 블록이 쓰는 조합이다
    // 마감 회차를 가진 주최사를 찾는다 — 상태 필터가 실제로 일하는지 보려면 필요하다
    const providerId = MOCK_EVENTS.find((e) => e.status === "마감")!.provider.id;
    const expectedOpen = MOCK_EVENTS.filter(
      (e) => e.provider.id === providerId && e.status === "신청 가능",
    );
    const expectedAll = MOCK_EVENTS.filter((e) => e.provider.id === providerId);
    expect(expectedAll.length).toBeGreaterThan(expectedOpen.length);

    const { items } = await mockEventApi.getList({ providerId, status: "OPEN", limit: 20 });
    expect(items.map((e) => e.id).sort()).toEqual(expectedOpen.map((e) => e.id).sort());

    // 상태 필터를 빼면 마감 회차까지 온다 — 거른 것이 상태이지 주최사가 아니다
    const all = await mockEventApi.getList({ providerId, limit: 20 });
    expect(all.items).toHaveLength(expectedAll.length);
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
    const openLatest = MOCK_EVENTS.filter(isOpen).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    )[0];
    expect(feed.newlyAdded[0].id).toBe(openLatest.id);
  });

  it("getHomeFeed 는 세 섹션 모두 마감 건을 뺀다", async () => {
    // 홈에는 상태 필터가 없다. 마감 건이 섞이면 걷어낼 수단이 없으므로 아예
    // 내리지 않는다 (5.3). `feature` 카드에서 상태 배지를 뺀 근거이기도 하다.
    const feed = await mockEventApi.getHomeFeed({});

    for (const section of [feed.weeklyPopular, feed.myAgeGroup, feed.newlyAdded]) {
      expect(section.every(isOpen)).toBe(true);
    }

    // 거를 것이 실제로 있어야 이 테스트가 의미를 갖는다 — 마감 건 중 적어도
    // 하나는 걸러내지 않았다면 어느 한 섹션에 떴을 조건을 갖추고 있어야 한다.
    const closed = MOCK_EVENTS.filter((event) => !isOpen(event));
    expect(closed.length).toBeGreaterThan(0);
    expect(
      closed.some(
        (event) => isThisWeek(event.date) || isEligible(event, MOCK_VIEWER),
      ),
      "마감 건이 어느 섹션 조건에도 맞지 않아 필터가 일하는지 알 수 없다",
    ).toBe(true);
  });

  it("검색은 소개팅명·지역·주최사를 본다", async () => {
    const keyword = "성수";
    const hits = await mockEventApi.search(keyword);
    const expected = MOCK_EVENTS.filter((e) =>
      [e.title, e.area, e.provider.name].join(" ").includes(keyword),
    );
    expect(expected.length, `목 데이터에 '${keyword}' 가 없다`).toBeGreaterThan(0);
    expect(hits.map((e) => e.id).sort()).toEqual(expected.map((e) => e.id).sort());
    // 주최사명으로 검색하면 그 주최사의 회차가 전부 나온다
    const provider = MOCK_EVENTS[0].provider;
    const byProvider = await mockEventApi.search(provider.name);
    expect(byProvider.map((e) => e.id).sort()).toEqual(
      MOCK_EVENTS.filter((e) => e.provider.id === provider.id)
        .map((e) => e.id)
        .sort(),
    );
    expect(await mockEventApi.search("   ")).toEqual([]);
  });

  it("getByIds 는 마감 회차도 돌려준다 — 찜한 소개팅은 마감돼도 남는다 (9장)", async () => {
    // `getHomeFeed` 와 반대 규칙이다. 거를 대상이 실제로 있어야 이 테스트가 뜻을 갖는다
    const closed = MOCK_EVENTS.filter((event) => !isOpen(event));
    expect(closed.length).toBeGreaterThan(0);

    const got = await mockEventApi.getByIds(closed.map((event) => event.id));
    expect(got.map((event) => event.id).sort()).toEqual(closed.map((event) => event.id).sort());
  });

  it("getByIds 는 없는 id 를 에러 없이 뺀다 — 삭제된 회차 하나가 목록을 죽이지 않게", async () => {
    const [first] = MOCK_EVENTS;

    const got = await mockEventApi.getByIds([first.id, "없는-회차"]);
    expect(got.map((event) => event.id)).toEqual([first.id]);
  });

  it("getByIds 는 빈 요청에 빈 배열이다", async () => {
    expect(await mockEventApi.getByIds([])).toEqual([]);
  });

  it("getByIds 가 돌려준 객체를 고쳐도 다음 조회에 새지 않는다 (4.31 `detached`)", async () => {
    const [first] = MOCK_EVENTS;

    const [got] = await mockEventApi.getByIds([first.id]);
    got.title = "바뀐 제목";

    const [again] = await mockEventApi.getByIds([first.id]);
    expect(again.title).toBe(first.title);
  });

  it("없는 id 는 404 ApiError 로 떨어진다", async () => {
    await expect(mockEventApi.getDetail("nope")).rejects.toMatchObject({
      status: 404,
    });
  });
});
