import { describe, expect, it } from "vitest";
import {
  HOME_SECTION_KEYS,
  type EventSummary,
  type HomeFeed,
  type HomeSectionKey,
} from "@/entities/event";
import { parseExploreParams } from "@/features/event-filter";
import { districtShortcuts, homeSections } from "./sections";

type DistrictCode = EventSummary["district"];

/** 링크가 도착한 탐색 화면의 조건 — 문자열이 아니라 **읽힌 결과**를 본다 */
function landing(href: string) {
  const search = new URL(href, "http://localhost").searchParams;
  return parseExploreParams(Object.fromEntries(search), { hasViewer: true });
}

/**
 * 목 데이터를 쓰지 않고 직접 짓는다. 여기서 볼 것은 **섹션을 넣고 빼는 규칙**이지
 * 목 8건의 내용이 아니다 — 목이 바뀔 때마다 이 파일이 깨질 이유가 없다.
 */
function event(id: string, district: DistrictCode): EventSummary {
  return {
    id,
    title: `${id} 소개팅`,
    shortTitle: id,
    provider: { id: "prv-x", name: "테스트주최사" },
    thumbnailUrl: null,
    date: "2026-09-04T19:30:00+09:00",
    dateLabel: "9/4(금)",
    timeLabel: "19:30",
    timeSlot: "DINNER",
    birthYearFrom: 1990,
    birthYearTo: 1999,
    maleCapacity: 7,
    femaleCapacity: 7,
    scale: "STANDARD",
    malePrice: 45000,
    femalePrice: 35000,
    status: "신청 가능",
    jobGroups: [],
    mood: [],
    area: "성수·건대",
    province: "SEOUL",
    district,
    locationPrecision: "DISTRICT",
    stationName: null,
    lat: 37.5,
    lng: 127.05,
    distanceKm: null,
    popularity: 100,
    createdAt: "2026-08-21T10:00:00+09:00",
    isLiked: false,
  };
}

function feedOf(sections: Partial<Record<HomeSectionKey, EventSummary[]>>): HomeFeed {
  return {
    weeklyPopular: [],
    myAgeGroup: [],
    newlyAdded: [],
    ...sections,
    baseAreaLabel: "성수동",
  };
}

const full = feedOf({
  weeklyPopular: [event("a", "SEONGDONG")],
  myAgeGroup: [event("b", "GANGNAM")],
  newlyAdded: [event("c", "MAPO")],
});

describe("homeSections", () => {
  it("5.1 의 순서대로 돌려준다", () => {
    expect(homeSections(full, { showMyAgeGroup: true }).map((s) => s.key)).toEqual([
      "weeklyPopular",
      "myAgeGroup",
      "newlyAdded",
    ]);
  });

  it("`HomeFeed` 의 섹션을 하나도 빠뜨리지 않는다", () => {
    // 섹션이 늘면 여기서 걸린다 — entities 의 키 목록이 원본이고, 표에 줄을
    // 추가하지 않으면 새 섹션이 응답에만 있고 화면에는 없는 상태가 된다
    const keys = homeSections(full, { showMyAgeGroup: true }).map((s) => s.key);

    expect([...keys].sort()).toEqual([...HOME_SECTION_KEYS].sort());
  });

  it("게스트에게는 `내 나이대` 를 숨기고 `새로 등록된` 이 위로 올라온다", () => {
    const keys = homeSections(full, { showMyAgeGroup: false }).map((s) => s.key);

    expect(keys).toEqual(["weeklyPopular", "newlyAdded"]);
  });

  it("건수 0인 섹션은 그리지 않는다", () => {
    const empty = feedOf({ newlyAdded: [event("c", "MAPO")] });

    expect(homeSections(empty, { showMyAgeGroup: true }).map((s) => s.key)).toEqual([
      "newlyAdded",
    ]);
  });

  it("섹션마다 카드 변형과 `전체보기 >` 프리셋이 다르다", () => {
    const sections = homeSections(full, { showMyAgeGroup: true });

    expect(sections.map((s) => s.variant)).toEqual(["feature", "ratio", "compact"]);
    // 프리셋이 같으면 세 `전체보기 >` 가 같은 화면으로 간다 (5-8)
    expect(new Set(sections.map((s) => s.moreHref)).size).toBe(sections.length);
    // 셋 다 리스트다 — 기본값이라 주소에 `view` 가 실리지 않을 뿐이다 (4.25)
    for (const section of sections) expect(landing(section.moreHref).view).toBe("list");
  });

  it("`전체보기 >` 의 프리셋이 도착한 화면에 걸린다 — 주소는 exploreHref 가 만든다 (4.24)", () => {
    const [weekly, age, fresh] = homeSections(full, { showMyAgeGroup: true });

    expect(landing(weekly.moreHref).query).toMatchObject({ when: "THIS_WEEK", sort: "popular" });
    // 로그인 사용자의 기본값이라 주소에서 빠져도 켜진 채 도착한다
    expect(landing(age.moreHref).query.eligibleOnly).toBe(true);
    expect(landing(fresh.moreHref).query.sort).toBe("latest");
  });
});

describe("districtShortcuts", () => {
  it("화면에 뜬 소개팅의 구만 내놓고 중복을 접는다", () => {
    const sections = homeSections(
      feedOf({
        weeklyPopular: [event("a", "SEONGDONG"), event("b", "GANGNAM")],
        newlyAdded: [event("c", "SEONGDONG")],
      }),
      { showMyAgeGroup: true },
    );

    expect(districtShortcuts(sections).map((s) => s.code)).toEqual([
      "SEONGDONG",
      "GANGNAM",
    ]);
  });

  it("코드가 아니라 구 이름을 라벨로 쓴다", () => {
    const sections = homeSections(feedOf({ weeklyPopular: [event("a", "SEONGDONG")] }), {
      showMyAgeGroup: true,
    });

    expect(districtShortcuts(sections)[0].label).toBe("성동구");
    expect(districtShortcuts(sections)[0].href).toContain("district=SEONGDONG");
  });

  it("칩은 그 구가 걸린 지도로 간다 — 프로모 카드와 같은 뷰다 (5-6 · 5-7)", () => {
    const sections = homeSections(feedOf({ weeklyPopular: [event("a", "MAPO")] }), {
      showMyAgeGroup: true,
    });
    const landed = landing(districtShortcuts(sections)[0].href);

    expect(landed.view).toBe("map");
    expect(landed.query.district).toBe("MAPO");
  });

  it("4개를 넘기지 않는다", () => {
    const many: DistrictCode[] = [
      "SEONGDONG",
      "GANGNAM",
      "MAPO",
      "JUNG",
      "SONGPA",
      "YONGSAN",
    ];
    const sections = homeSections(
      feedOf({ weeklyPopular: many.map((code) => event(code, code)) }),
      { showMyAgeGroup: true },
    );

    expect(districtShortcuts(sections)).toHaveLength(4);
  });

  it("게스트가 못 보는 섹션의 구는 바로가기에도 없다", () => {
    const sections = homeSections(full, { showMyAgeGroup: false });

    expect(districtShortcuts(sections).map((s) => s.code)).not.toContain("GANGNAM");
  });
});
