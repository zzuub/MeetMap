import { describe, expect, it } from "vitest";
import { AREAS, AREA_CENTERS, type Area } from "@/shared/config";
import { nearestArea } from "./nearestArea";

/**
 * 목 역지오코딩의 규칙 (4.2).
 *
 * 화면이 이 값으로 `/explore?area=…` 를 만들기 때문에 **마스터 밖 값이 나오면
 * 조용한 0건**이 된다 — `parseArea`(6.1)가 막아 주지만 그때는 이미 지역이 사라진
 * 뒤다. 그래서 여기서 잠근다.
 */
describe("좌표 → 지역 마스터", () => {
  it("대표 좌표는 자기 지역으로 되돌아온다", () => {
    for (const area of AREAS) {
      expect(nearestArea(AREA_CENTERS[area]), area).toBe(area);
    }
  });

  it("마스터의 모든 지역이 도달 가능하다 — 아무도 못 고르는 지역이 없다", () => {
    const reachable = new Set(AREAS.map((area) => nearestArea(AREA_CENTERS[area])));
    expect(reachable.size).toBe(AREAS.length);
  });

  it("대표 좌표에서 조금 벗어나도 같은 지역이다", () => {
    // 약 300m. 이 정도로 답이 바뀌면 사용자가 건물을 옮길 때마다 지역이 튄다
    for (const area of AREAS) {
      const center = AREA_CENTERS[area];
      expect(nearestArea({ lat: center.lat + 0.0027, lng: center.lng }), area).toBe(area);
    }
  });

  it("마스터 밖 좌표도 답을 낸다 — 상한을 두지 않기로 했다", () => {
    // 부산. MVP1 은 서울 전용이라 밖에서 열 이유가 없고, "얼마부터 밖인가"의
    // 근거가 없다. 실 API 는 행정구역으로 판정하므로 계약만 `null` 을 받아 둔다
    const far: Area = nearestArea({ lat: 35.1796, lng: 129.0756 });
    expect(AREAS).toContain(far);
  });

  it("가장 가까운 것을 고른다 — 선언 순서가 아니다", () => {
    // 강남·역삼(37.4979)에 붙여 두고 마스터 첫 항목(성수·건대)이 나오면
    // 거리 비교가 아니라 배열 순서를 돌려주고 있는 것이다
    expect(nearestArea({ lat: 37.4985, lng: 127.028 })).toBe("강남·역삼");
  });
});
