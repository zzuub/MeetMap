import type {
  KakaoCustomOverlay,
  KakaoMap,
  KakaoMapsApi,
} from "../api/kakaoTypes";
import {
  EMPTY_LEVEL,
  FIT_PADDING,
  MAX_LEVEL,
  MIN_LEVEL,
  SEOUL_CENTER,
  flooredLevel,
  planViewport,
  steppedLevel,
  type LatLngLiteral,
  type ViewportPlan,
  type ZoomDirection,
} from "./viewport";

/**
 * SDK 지도 하나를 쥐고 **마커 · 범위 · 줌**을 다루는 객체 (6.6 · 6.7).
 *
 * React 밖으로 뗐다 — SDK 를 흉내 낸 가짜로 **jsdom 없이** 잠그려는 것이다
 * (`createSearchController` 와 같은 수법 · `decisions.md` 4.61). 화면은 이 객체를 만들고
 * 이벤트를 넘기기만 한다.
 */
export interface MapPin extends LatLngLiteral {
  id: string;
  /** SDK 오버레이에 넘길 상자. 안은 React 가 포털로 그린다 */
  element: HTMLElement;
}

export interface MapController {
  /** 마커를 갈아 끼운다. **결과 집합이 바뀌었을 때만** 범위를 다시 맞춘다 */
  showPins(pins: readonly MapPin[]): void;
  zoom(direction: ZoomDirection): void;
  /** 상자 크기가 바뀌었다 */
  relayout(): void;
  dispose(): void;
}

export function createMapController(
  maps: KakaoMapsApi,
  container: HTMLElement,
  { onLevelChange }: { onLevelChange(level: number): void },
): MapController {
  const map = new maps.Map(container, {
    center: toLatLng(maps, SEOUL_CENTER),
    level: EMPTY_LEVEL,
  });
  // 핀치·휠도 한계를 넘지 못하게 SDK 에 건다 — 버튼만 막으면 손가락으로는 넘어간다
  map.setMinLevel(MIN_LEVEL);
  map.setMaxLevel(MAX_LEVEL);

  const reportLevel = () => onLevelChange(map.getLevel());
  maps.event.addListener(map, "zoom_changed", reportLevel);
  reportLevel();

  let overlays: KakaoCustomOverlay[] = [];
  let shownIds = "";

  return {
    showPins(pins) {
      for (const overlay of overlays) overlay.setMap(null);

      overlays = pins.map((pin) => {
        const overlay = new maps.CustomOverlay({
          position: toLatLng(maps, pin),
          content: pin.element,
          // 핀 끝(아래 가운데)이 좌표다
          xAnchor: 0.5,
          yAnchor: 1,
          clickable: true,
        });
        overlay.setMap(map);
        return overlay;
      });

      /*
        같은 결과면 사용자가 옮겨 둔 범위를 지킨다. 0건이면 보던 곳에 머문다.

        ⚠️ **0건 가지는 지금 앱에서 도달하지 않는다** — `ExploreMapBoard` 가 0건이면 지도를
        아예 안 그린다(4.71 표). 남겨 두는 것은 P3-2 가 지도를 붙인 채 결과를 바꾸는 길을
        만들기 때문이고, 그때 이 안전망이 처음 실전에 선다 (PR #48 리뷰).
      */
      const ids = pins.map((pin) => pin.id).sort().join(",");
      if (ids !== shownIds && pins.length > 0) applyViewport(maps, map, planViewport(pins));
      shownIds = ids;
    },

    zoom(direction) {
      const next = steppedLevel(map.getLevel(), direction);
      if (next !== null) map.setLevel(next, { animate: true });
    },

    relayout: () => map.relayout(),

    dispose() {
      maps.event.removeListener(map, "zoom_changed", reportLevel);
      for (const overlay of overlays) overlay.setMap(null);
      overlays = [];
    },
  };
}

function applyViewport(maps: KakaoMapsApi, map: KakaoMap, plan: ViewportPlan) {
  if (plan.kind === "center") {
    map.setCenter(toLatLng(maps, plan.center));
    map.setLevel(plan.level);
    return;
  }

  const bounds = new maps.LatLngBounds();
  bounds.extend(toLatLng(maps, plan.southWest));
  bounds.extend(toLatLng(maps, plan.northEast));
  map.setBounds(bounds, FIT_PADDING.top, FIT_PADDING.right, FIT_PADDING.bottom, FIT_PADDING.left);

  // 몰려 있는 결과에 맞추면 골목까지 확대된다 — 바닥에서 멈춘다
  const floored = flooredLevel(map.getLevel());
  if (floored !== map.getLevel()) map.setLevel(floored);
}

function toLatLng(maps: KakaoMapsApi, point: LatLngLiteral) {
  return new maps.LatLng(point.lat, point.lng);
}
