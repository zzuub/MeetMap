import { describe, expect, it } from "vitest";
import {
  EMPTY_LEVEL,
  FIT_FLOOR_LEVEL,
  MAX_LEVEL,
  MIN_LEVEL,
  SEOUL_CENTER,
  flooredLevel,
  planViewport,
  steppedLevel,
  zoomAvailability,
} from "./viewport";

/**
 * 지도가 어디를 얼마나 보여 주나 (6.6 · 6.7 · `decisions.md` 4.71).
 *
 * 뷰포트는 URL 에 없고 **결과가 정한다** — 그 규칙과 줌 한계를 SDK 없이 본다.
 */
describe("planViewport — 결과가 범위를 정한다", () => {
  it("결과가 없으면 서울 전역이다 — 사용자 위치로 잡지 않는다", () => {
    expect(planViewport([])).toEqual({
      kind: "center",
      center: SEOUL_CENTER,
      level: EMPTY_LEVEL,
    });
  });

  it("한 건이면 그 점이 가운데이고 바닥 레벨이다 — 골목까지 확대하지 않는다", () => {
    const point = { lat: 37.5445, lng: 127.0557 };

    expect(planViewport([point])).toEqual({
      kind: "center",
      center: point,
      level: FIT_FLOOR_LEVEL,
    });
  });

  it("같은 점에 여러 건이면 한 건과 같다 — 범위가 없다", () => {
    const point = { lat: 37.5, lng: 127 };

    expect(planViewport([point, { ...point }]).kind).toBe("center");
  });

  it("여러 건이면 전부를 담는 가장 작은 사각형이다", () => {
    const points = [
      { lat: 37.55, lng: 126.92 },
      { lat: 37.49, lng: 127.03 },
      { lat: 37.51, lng: 127.09 },
    ];

    expect(planViewport(points)).toEqual({
      kind: "bounds",
      southWest: { lat: 37.49, lng: 126.92 },
      northEast: { lat: 37.55, lng: 127.09 },
    });
  });

  it("넣는 순서와 무관하다", () => {
    const points = [
      { lat: 37.55, lng: 126.92 },
      { lat: 37.49, lng: 127.03 },
      { lat: 37.51, lng: 127.09 },
    ];

    expect(planViewport([...points].reverse())).toEqual(planViewport(points));
  });
});

describe("줌 한계 (6.6 `한계에 도달하면 해당 버튼 비활성`)", () => {
  it("가장 가까우면 확대만 막힌다", () => {
    expect(zoomAvailability(MIN_LEVEL)).toEqual({ canZoomIn: false, canZoomOut: true });
  });

  it("가장 멀면 축소만 막힌다", () => {
    expect(zoomAvailability(MAX_LEVEL)).toEqual({ canZoomIn: true, canZoomOut: false });
  });

  it("카카오 레벨은 작을수록 확대다 — 확대는 레벨을 내린다", () => {
    expect(steppedLevel(5, "in")).toBe(4);
    expect(steppedLevel(5, "out")).toBe(6);
  });

  it("한계 밖으로는 옮기지 않는다", () => {
    expect(steppedLevel(MIN_LEVEL, "in")).toBeNull();
    expect(steppedLevel(MAX_LEVEL, "out")).toBeNull();
  });

  it("버튼의 판정과 실제 이동이 모든 레벨에서 같다 — 어긋나면 눌러도 안 움직이는 버튼이 켜진다", () => {
    for (let level = MIN_LEVEL; level <= MAX_LEVEL; level += 1) {
      const { canZoomIn, canZoomOut } = zoomAvailability(level);

      expect(canZoomIn, `레벨 ${level} 확대`).toBe(steppedLevel(level, "in") !== null);
      expect(canZoomOut, `레벨 ${level} 축소`).toBe(steppedLevel(level, "out") !== null);
    }
  });

  it("맞춘 결과가 바닥보다 가까우면 바닥으로 물린다", () => {
    expect(flooredLevel(FIT_FLOOR_LEVEL - 2)).toBe(FIT_FLOOR_LEVEL);
    expect(flooredLevel(FIT_FLOOR_LEVEL + 1)).toBe(FIT_FLOOR_LEVEL + 1);
  });

  it("레벨 상수가 한계 안에서 순서를 지킨다", () => {
    expect(MIN_LEVEL).toBeLessThan(FIT_FLOOR_LEVEL);
    expect(FIT_FLOOR_LEVEL).toBeLessThanOrEqual(EMPTY_LEVEL);
    expect(EMPTY_LEVEL).toBeLessThanOrEqual(MAX_LEVEL);
  });
});
