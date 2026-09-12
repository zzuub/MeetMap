import { describe, expect, it } from "vitest";
import type { EventSummary, LocationPrecision } from "@/entities/event";
import { toMapMarker } from "./markers";

/** 목 데이터를 쓰지 않고 짓는다 — 볼 것은 변환 규칙이지 목 8건의 내용이 아니다 */
function event(overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id: "evt-x",
    title: "성수 루프탑 와인 소개팅",
    shortTitle: "성수 루프탑",
    provider: { id: "prv-x", name: "테스트주최사" },
    thumbnailUrl: null,
    date: "2026-09-12T19:30:00+09:00",
    dateLabel: "9/12(토)",
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
    district: "SEONGDONG",
    locationPrecision: "EXACT",
    stationName: null,
    lat: 37.5445,
    lng: 127.0557,
    distanceKm: null,
    popularity: 100,
    createdAt: "2026-08-21T10:00:00+09:00",
    isLiked: false,
    ...overrides,
  };
}

describe("toMapMarker (6.6)", () => {
  it("라벨은 시각뿐이다 — 소개팅명을 싣지 않는다 (2026-08-31 수정)", () => {
    expect(toMapMarker(event()).label).toBe("19:30");
  });

  it("무엇인지는 접근 이름이 말한다 — 날짜 · 시각 · 제목", () => {
    const { accessibleName } = toMapMarker(event());

    for (const part of ["9/12(토)", "19:30", "성수 루프탑 와인 소개팅"]) {
      expect(accessibleName).toContain(part);
    }
  });

  it("위치는 카드·상세와 같은 말로 한다 — 역 기준은 `○○역 인근`, 구 중심은 구 이름", () => {
    const station = event({ locationPrecision: "STATION", stationName: "강남역" });
    const district = event({ locationPrecision: "DISTRICT" });

    expect(toMapMarker(station).accessibleName).toContain("강남역 인근");
    expect(toMapMarker(district).accessibleName).toContain("성동구");
  });

  it.each<LocationPrecision>(["EXACT", "STATION", "DISTRICT"])(
    "정밀도 `%s` 를 그대로 넘긴다 — 모양은 화면이 고른다",
    (precision) => {
      const marker = toMapMarker(event({ locationPrecision: precision, stationName: "강남역" }));

      expect(marker.precision).toBe(precision);
    },
  );

  it("상세로 간다 — 마커 시트(P3-2) 전까지", () => {
    expect(toMapMarker(event({ id: "evt-q" })).href).toBe("/events/evt-q");
  });

  it("좌표를 그대로 옮긴다", () => {
    const marker = toMapMarker(event({ lat: 37.1, lng: 127.2 }));

    expect([marker.lat, marker.lng]).toEqual([37.1, 127.2]);
  });
});
