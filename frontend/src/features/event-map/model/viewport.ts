/**
 * 지도가 **어디를 얼마나** 보여 주나 (6.6 · 6.7 · `decisions.md` 4.71).
 *
 * 뷰포트는 URL 에 싣지 않는다 — 2.4 가 URL 원본으로 적은 것은 필터·정렬·뷰뿐이다. 대신
 * **결과가 정한다**: 조건에 맞는 마커가 다 들어오게 맞춘다. 그래서 `?district=` 로 들어와도
 * 구 중심 좌표 없이 중심이 선다(결과가 곧 그 구 안에 있다). 사용자 위치로는 잡지 않는다 (4.54).
 *
 * 카카오 레벨은 **작을수록 확대**다. 아래 레벨 숫자는 **재지 않은 초기값**이다 — 키가 생기면
 * 375×667 에서 재서 고친다 (`phase3-notes.md`).
 */

export interface LatLngLiteral {
  lat: number;
  lng: number;
}

/** 가장 가깝게 볼 수 있는 레벨 — SDK 의 하한 그대로다 */
export const MIN_LEVEL = 1;

/** 가장 멀리 볼 수 있는 레벨. 서울 밖 소개팅은 없다(MVP1) — 전국까지 물러날 이유가 없다 */
export const MAX_LEVEL = 10;

/** 결과가 없을 때의 레벨 — 서울 전역을 겨냥한다 */
export const EMPTY_LEVEL = 8;

/** 결과에 맞추되 이보다 가깝게는 가지 않는다 — 한 건이거나 몰려 있으면 골목까지 확대된다 */
export const FIT_FLOOR_LEVEL = 5;

/** 결과가 없을 때의 중심 — 서울시청. 구 중심 좌표는 없다 (6.7 TBD · 16장) */
export const SEOUL_CENTER: LatLngLiteral = { lat: 37.5666, lng: 126.9784 };

/**
 * 결과에 맞출 때 가장자리에서 띄우는 거리(px). 마커는 라벨이 핀 위에 서므로 위를 띄우고,
 * 아래는 범례·줌 버튼이 덮으므로 더 띄운다.
 */
export const FIT_PADDING = { top: 56, right: 40, bottom: 112, left: 40 } as const;

export type ViewportPlan =
  | { kind: "center"; center: LatLngLiteral; level: number }
  | { kind: "bounds"; southWest: LatLngLiteral; northEast: LatLngLiteral };

export function planViewport(points: readonly LatLngLiteral[]): ViewportPlan {
  if (points.length === 0) {
    return { kind: "center", center: SEOUL_CENTER, level: EMPTY_LEVEL };
  }

  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const southWest = { lat: Math.min(...lats), lng: Math.min(...lngs) };
  const northEast = { lat: Math.max(...lats), lng: Math.max(...lngs) };

  // 한 점(또는 전부 같은 점)이면 범위가 없다 — SDK 에 맡기면 가장 가깝게 확대한다
  if (southWest.lat === northEast.lat && southWest.lng === northEast.lng) {
    return { kind: "center", center: southWest, level: FIT_FLOOR_LEVEL };
  }

  return { kind: "bounds", southWest, northEast };
}

/** 맞춘 결과가 바닥보다 가까우면 바닥으로 물린다 */
export function flooredLevel(level: number): number {
  return Math.max(level, FIT_FLOOR_LEVEL);
}

export type ZoomDirection = "in" | "out";

export interface ZoomAvailability {
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export function zoomAvailability(level: number): ZoomAvailability {
  return { canZoomIn: level > MIN_LEVEL, canZoomOut: level < MAX_LEVEL };
}

/** 한 단계 옮긴 레벨. 한계 밖이면 `null` — 부르는 쪽이 아무것도 하지 않는다 */
export function steppedLevel(level: number, direction: ZoomDirection): number | null {
  // 레벨은 작을수록 확대다 — 확대가 내리고 축소가 올린다. 뒤집으면 `zoomAvailability`
  // 와 어긋나 "눌러도 안 움직이는 켜진 버튼"이 생긴다(테스트가 모든 레벨에서 맞춰 본다)
  const next = direction === "in" ? level - 1 : level + 1;
  return next < MIN_LEVEL || next > MAX_LEVEL ? null : next;
}
