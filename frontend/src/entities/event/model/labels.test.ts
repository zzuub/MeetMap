import { describe, expect, it } from "vitest";
import {
  PRICE_UNKNOWN_LABEL,
  birthYearLabel,
  birthYearRangeLabel,
  capacityLabel,
  locationLabel,
  priceDisplay,
  providerScheduleLabel,
  providerSlotLabel,
  scaleLabel,
  timeSlotLabel,
} from "./labels";
import type { EventSummary } from "./types";

/**
 * 표기 규칙 테스트.
 *
 * 카드 5종이 이 함수들 위에 서 있으므로 DOM 없이 여기서 경계를 덮는다.
 * 목 데이터에 심어 둔 경계값(가격 `null`, 세기가 바뀌는 출생연도, 정밀도 3종)이
 * 대상이다.
 */

describe("birthYearLabel / birthYearRangeLabel", () => {
  it("네 자리 연도를 두 자리 관용 표기로 줄인다", () => {
    expect(birthYearLabel(1996)).toBe("96년생");
  });

  it("2000년대생의 앞 0을 지키지 않으면 읽히지 않는다", () => {
    expect(birthYearLabel(2003)).toBe("03년생");
    expect(birthYearLabel(2000)).toBe("00년생");
  });

  it("범위를 물결로 잇는다", () => {
    expect(birthYearRangeLabel(1990, 1996)).toBe("90~96년생");
  });

  it("세기를 넘는 범위에서도 두 자리를 유지한다 (evt-008: 1997~2003)", () => {
    expect(birthYearRangeLabel(1997, 2003)).toBe("97~03년생");
  });

  it("시작과 끝이 같으면 범위로 쓰지 않는다", () => {
    expect(birthYearRangeLabel(1995, 1995)).toBe("95년생");
  });
});

describe("capacityLabel", () => {
  it("성비 게이지 대신 남녀 정원을 나란히 쓴다", () => {
    expect(capacityLabel(7, 7)).toBe("남 7 · 여 7");
  });

  it("비대칭 회차도 그대로 답한다", () => {
    expect(capacityLabel(10, 4)).toBe("남 10 · 여 4");
  });
});

describe("priceDisplay", () => {
  const paid = { malePrice: 45000, femalePrice: 35000 };
  const unknown = { malePrice: null, femalePrice: null };

  it("여성 사용자에게는 여성 기준값만 준다", () => {
    expect(priceDisplay(paid, "F")).toEqual({ kind: "single", amount: 35000 });
  });

  it("남성 사용자에게는 남성 기준값만 준다", () => {
    expect(priceDisplay(paid, "M")).toEqual({ kind: "single", amount: 45000 });
  });

  it("게스트에게는 병기한다 — 어느 쪽이 자기 값인지 모르기 때문이다", () => {
    expect(priceDisplay(paid, null)).toEqual({
      kind: "both",
      male: 45000,
      female: 35000,
    });
  });

  it("가격 미확인 건(evt-004)은 성별과 무관하게 unknown 이다", () => {
    expect(priceDisplay(unknown, "F")).toEqual({ kind: "unknown" });
    expect(priceDisplay(unknown, "M")).toEqual({ kind: "unknown" });
    expect(priceDisplay(unknown, null)).toEqual({ kind: "unknown" });
  });

  it("내 성별 쪽만 미확인이면 0원이 아니라 unknown 이다", () => {
    expect(priceDisplay({ malePrice: 45000, femalePrice: null }, "F")).toEqual({
      kind: "unknown",
    });
  });

  it("게스트는 한쪽만 확인돼도 아는 쪽을 보여준다", () => {
    expect(priceDisplay({ malePrice: 45000, femalePrice: null }, null)).toEqual({
      kind: "both",
      male: 45000,
      female: null,
    });
  });

  it("미확인 표기는 '무료'로 읽히지 않는 문구다", () => {
    expect(PRICE_UNKNOWN_LABEL).toBe("링크 확인");
  });
});

describe("locationLabel", () => {
  const base: Pick<
    EventSummary,
    "locationPrecision" | "stationName" | "district" | "area"
  > = {
    locationPrecision: "EXACT",
    stationName: null,
    district: "SEONGDONG",
    area: "성수·건대",
  };

  it("EXACT 는 동 단위 지역명을 쓴다", () => {
    expect(locationLabel(base)).toBe("성수·건대");
  });

  it("STATION 은 역 인근임을 밝힌다 — 정확한 주소로 오해하면 헛걸음한다", () => {
    expect(
      locationLabel({
        ...base,
        locationPrecision: "STATION",
        stationName: "강남역",
        district: "GANGNAM",
      }),
    ).toBe("강남역 인근");
  });

  it("DISTRICT 는 구까지만 답한다", () => {
    expect(
      locationLabel({ ...base, locationPrecision: "DISTRICT", district: "MAPO" }),
    ).toBe("마포구");
  });

  it("STATION 인데 역명이 비면 구로 떨어뜨린다", () => {
    expect(
      locationLabel({ ...base, locationPrecision: "STATION", district: "JUNG" }),
    ).toBe("중구");
  });
});

describe("메타 줄", () => {
  // provider 는 2026-09-02 부터 객체다 — id 가 없으면 주최사 페이지로 링크할 수 없다
  const event = {
    provider: { id: "prv-001", name: "로테이션서울" },
    dateLabel: "9/4(금)",
    timeLabel: "19:30",
    timeSlot: "DINNER",
  } as const;

  it("리스트·시트는 주최사 · 날짜 시각", () => {
    expect(providerScheduleLabel(event)).toBe("로테이션서울 · 9/4(금) 19:30");
  });

  it("소형 카드는 날짜 대신 시간대를 쓴다 (5.3)", () => {
    expect(providerSlotLabel(event)).toBe("로테이션서울 · 디너 19:30");
  });
});

describe("코드 → 라벨", () => {
  it("시간대 4종", () => {
    expect(timeSlotLabel("MORNING")).toBe("오전");
    expect(timeSlotLabel("AFTERNOON")).toBe("오후");
    expect(timeSlotLabel("DINNER")).toBe("디너");
    expect(timeSlotLabel("LATE_NIGHT")).toBe("심야");
  });

  it("규모 3종", () => {
    expect(scaleLabel("SMALL")).toBe("소수정예");
    expect(scaleLabel("STANDARD")).toBe("표준");
    expect(scaleLabel("LARGE")).toBe("대규모");
  });
});
