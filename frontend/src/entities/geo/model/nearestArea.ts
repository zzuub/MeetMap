import { AREA_CENTERS, type Area } from "@/shared/config";
import type { GeoPoint } from "./types";

/**
 * 좌표에서 가장 가까운 지역 마스터 값 (4.2).
 *
 * **목 역지오코딩의 규칙**이자, 목 회차 좌표가 자기 `area` 와 어긋나지 않는지
 * 검증하는 기준이다 (`app/_consistency/`). 실 모드에서는 서버가 행정구역으로
 * 판정하므로 이 함수를 타지 않는다.
 *
 * 마스터 밖(서울 밖·먼 바다)을 걸러내지 않는다 — 가장 가까운 값이 언제나 하나
 * 나온다. 거리 상한을 두면 "얼마부터 밖인가"를 지금 정해야 하는데 근거가 없고,
 * MVP1 은 서울 전용이라 밖에서 열 이유가 없다. 실 API 는 그 판정을 할 수 있으므로
 * 계약(`ReverseGeocoded.area`)만 `null` 을 받아 둔다.
 */
export function nearestArea(point: GeoPoint): Area {
  const areas = Object.keys(AREA_CENTERS) as Area[];

  let best = areas[0];
  let bestKm = Number.POSITIVE_INFINITY;

  for (const area of areas) {
    const km = haversineKm(point, AREA_CENTERS[area]);
    if (km < bestKm) {
      best = area;
      bestKm = km;
    }
  }

  return best;
}

/**
 * 두 좌표 사이의 대원 거리(km).
 *
 * 서울 안 몇 km 를 재는 데는 평면 근사로도 충분하지만, 근사식은 위도에 따라
 * 오차가 달라져 **어느 지역이 더 가까운가**의 답이 경계에서 뒤집힐 수 있다.
 * 판정이 뒤집히는 것보다 삼각함수 몇 번이 싸다.
 */
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const EARTH_RADIUS_KM = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
