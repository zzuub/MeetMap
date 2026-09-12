import { describe, expect, it, vi } from "vitest";
import type {
  KakaoCustomOverlay,
  KakaoCustomOverlayOptions,
  KakaoLatLng,
  KakaoLatLngBounds,
  KakaoMap,
  KakaoMapsApi,
} from "../api/kakaoTypes";
import { createMapController, type MapPin } from "./mapController";
import {
  EMPTY_LEVEL,
  FIT_FLOOR_LEVEL,
  FIT_PADDING,
  MAX_LEVEL,
  MIN_LEVEL,
  SEOUL_CENTER,
} from "./viewport";

/**
 * 마커 · 범위 · 줌 (6.6 · 6.7 · `decisions.md` 4.71).
 *
 * SDK 를 **흉내 낸 가짜**로 돈다 — 레벨을 한계에 가두고, 레벨이 바뀌면 `zoom_changed` 를
 * 쏘고, `setBounds` 는 정해 둔 레벨로 맞춘다. 가짜가 실물과 같은지는 여기서 못 본다 — 키가
 * 있는 브라우저가 본다 (4.71 `브라우저로만 확인`).
 */
class FakeLatLng implements KakaoLatLng {
  constructor(
    readonly lat: number,
    readonly lng: number,
  ) {}
  getLat() {
    return this.lat;
  }
  getLng() {
    return this.lng;
  }
}

class FakeBounds implements KakaoLatLngBounds {
  readonly points: KakaoLatLng[] = [];
  extend(latlng: KakaoLatLng) {
    this.points.push(latlng);
  }
}

/** 지도·마커 상자는 가짜 SDK 가 들고 있기만 한다 */
const CONTAINER = {} as HTMLElement;

function setup({ fitLevel = 7 } = {}) {
  const state = {
    level: 0,
    min: 1,
    max: 14,
    center: null as KakaoLatLng | null,
    fits: [] as { points: KakaoLatLng[]; padding: (number | undefined)[] }[],
    levelCalls: [] as { level: number; animate: boolean | undefined }[],
    relayouts: 0,
    overlays: [] as FakeOverlay[],
    zoomListeners: new Set<() => void>(),
  };

  /** SDK 안에서 레벨이 바뀐다 — 버튼이든 핀치든 같은 길로 `zoom_changed` 가 난다 */
  function changeLevel(level: number) {
    const next = Math.min(Math.max(level, state.min), state.max);
    if (next === state.level) return;
    state.level = next;
    for (const listener of state.zoomListeners) listener();
  }

  class FakeMap implements KakaoMap {
    constructor(_container: HTMLElement, options: { center: KakaoLatLng; level: number }) {
      state.level = options.level;
      state.center = options.center;
    }
    getLevel() {
      return state.level;
    }
    setLevel(level: number, options?: { animate?: boolean }) {
      state.levelCalls.push({ level, animate: options?.animate });
      changeLevel(level);
    }
    setMinLevel(level: number) {
      state.min = level;
    }
    setMaxLevel(level: number) {
      state.max = level;
    }
    setCenter(latlng: KakaoLatLng) {
      state.center = latlng;
    }
    setBounds(bounds: KakaoLatLngBounds, ...padding: (number | undefined)[]) {
      state.fits.push({
        points: bounds instanceof FakeBounds ? [...bounds.points] : [],
        padding,
      });
      changeLevel(fitLevel);
    }
    relayout() {
      state.relayouts += 1;
    }
  }

  class FakeOverlay implements KakaoCustomOverlay {
    map: KakaoMap | null = null;
    constructor(readonly options: KakaoCustomOverlayOptions) {
      state.overlays.push(this);
    }
    setMap(map: KakaoMap | null) {
      this.map = map;
    }
  }

  const maps: KakaoMapsApi = {
    LatLng: FakeLatLng,
    LatLngBounds: FakeBounds,
    Map: FakeMap,
    CustomOverlay: FakeOverlay,
    event: {
      addListener: (_target, _type, handler) => {
        state.zoomListeners.add(handler);
      },
      removeListener: (_target, _type, handler) => {
        state.zoomListeners.delete(handler);
      },
    },
    load: (callback) => callback(),
  };

  const onLevelChange = vi.fn();
  const controller = createMapController(maps, CONTAINER, { onLevelChange });

  return {
    controller,
    state,
    onLevelChange,
    /** 지금 지도에 붙어 있는 오버레이 */
    shown: () => state.overlays.filter((overlay) => overlay.map !== null),
    pinch: changeLevel,
  };
}

function pin(id: string, lat: number, lng: number): MapPin {
  return { id, lat, lng, element: {} as HTMLElement };
}

const SPREAD = [pin("a", 37.55, 126.92), pin("b", 37.49, 127.03)];

describe("만들 때", () => {
  it("서울 전역에서 시작한다 — 사용자 위치가 아니다", () => {
    const { state } = setup();

    expect(state.level).toBe(EMPTY_LEVEL);
    expect([state.center?.getLat(), state.center?.getLng()]).toEqual([
      SEOUL_CENTER.lat,
      SEOUL_CENTER.lng,
    ]);
  });

  it("줌 한계를 SDK 에 건다 — 핀치·휠도 넘지 못한다", () => {
    const { state } = setup();

    expect([state.min, state.max]).toEqual([MIN_LEVEL, MAX_LEVEL]);
  });

  it("첫 레벨을 알린다 — 버튼이 처음부터 한계를 안다", () => {
    expect(setup().onLevelChange).toHaveBeenLastCalledWith(EMPTY_LEVEL);
  });
});

describe("마커와 범위 (6.6)", () => {
  it("마커마다 오버레이 하나 — 핀 끝(아래 가운데)이 좌표이고 클릭이 지도로 새지 않는다", () => {
    const { controller, shown } = setup();
    controller.showPins(SPREAD);

    expect(shown()).toHaveLength(2);
    for (const overlay of shown()) {
      expect(overlay.options).toMatchObject({ xAnchor: 0.5, yAnchor: 1, clickable: true });
    }
    expect(shown().map((overlay) => overlay.options.content)).toEqual(
      SPREAD.map((item) => item.element),
    );
  });

  it("결과가 다 들어오게 맞춘다 — 가장자리에 범례·줌 자리를 띄운다", () => {
    const { controller, state } = setup();
    controller.showPins(SPREAD);

    expect(state.fits).toHaveLength(1);
    expect(state.fits[0].points.map((point) => [point.getLat(), point.getLng()])).toEqual([
      [37.49, 126.92],
      [37.55, 127.03],
    ]);
    expect(state.fits[0].padding).toEqual([
      FIT_PADDING.top,
      FIT_PADDING.right,
      FIT_PADDING.bottom,
      FIT_PADDING.left,
    ]);
  });

  it("같은 결과를 다시 받으면 범위를 건드리지 않는다 — 사용자가 옮겨 둔 곳을 지킨다", () => {
    const { controller, state, shown } = setup();
    controller.showPins(SPREAD);
    // 순서만 다르고 상자는 새것이다(다시 그린 서버 응답)
    controller.showPins([pin("b", 37.49, 127.03), pin("a", 37.55, 126.92)]);

    expect(state.fits).toHaveLength(1);
    expect(shown()).toHaveLength(2);
    expect(state.overlays).toHaveLength(4);
  });

  it("결과가 바뀌면 다시 맞춘다", () => {
    const { controller, state } = setup();
    controller.showPins(SPREAD);
    controller.showPins([...SPREAD, pin("c", 37.51, 127.09)]);

    expect(state.fits).toHaveLength(2);
  });

  it("0건이면 마커를 걷고 보던 곳에 머문다 — 서울로 튀지 않는다", () => {
    const { controller, state, shown } = setup();
    controller.showPins(SPREAD);
    const { level, center } = state;

    controller.showPins([]);

    expect(shown()).toHaveLength(0);
    expect(state.fits).toHaveLength(1);
    expect(state.level).toBe(level);
    expect(state.center).toBe(center);
  });

  it("0건 뒤에 같은 결과가 돌아오면 다시 맞춘다", () => {
    const { controller, state } = setup();
    controller.showPins(SPREAD);
    controller.showPins([]);
    controller.showPins(SPREAD);

    expect(state.fits).toHaveLength(2);
  });

  it("한 건이면 그 점이 가운데이고 바닥 레벨이다", () => {
    const { controller, state } = setup();
    controller.showPins([pin("a", 37.5445, 127.0557)]);

    expect([state.center?.getLat(), state.center?.getLng()]).toEqual([37.5445, 127.0557]);
    expect(state.level).toBe(FIT_FLOOR_LEVEL);
    expect(state.fits).toHaveLength(0);
  });

  it("몰려 있어 너무 가깝게 맞춰지면 바닥에서 멈춘다", () => {
    const { controller, state } = setup({ fitLevel: FIT_FLOOR_LEVEL - 3 });
    controller.showPins([pin("a", 37.5445, 127.0557), pin("b", 37.5446, 127.0558)]);

    expect(state.level).toBe(FIT_FLOOR_LEVEL);
  });

  it("퍼져 있으면 SDK 가 맞춘 레벨 그대로다", () => {
    const { controller, state } = setup({ fitLevel: FIT_FLOOR_LEVEL + 2 });
    controller.showPins(SPREAD);

    expect(state.level).toBe(FIT_FLOOR_LEVEL + 2);
  });
});

describe("줌 버튼 (6.6 · 6.7 `setLevel` 매핑)", () => {
  it("확대는 한 단계 — 레벨을 내리고 부드럽게 옮긴다", () => {
    const { controller, state } = setup();
    controller.zoom("in");

    expect(state.levelCalls.at(-1)).toEqual({ level: EMPTY_LEVEL - 1, animate: true });
  });

  it("축소는 한 단계 — 레벨을 올린다", () => {
    const { controller, state } = setup();
    controller.zoom("out");

    expect(state.levelCalls.at(-1)).toEqual({ level: EMPTY_LEVEL + 1, animate: true });
  });

  it("한계에서는 SDK 를 부르지 않는다", () => {
    const { controller, state } = setup();

    while (state.level > MIN_LEVEL) controller.zoom("in");
    const atMin = state.levelCalls.length;
    controller.zoom("in");
    expect(state.levelCalls).toHaveLength(atMin);

    while (state.level < MAX_LEVEL) controller.zoom("out");
    const atMax = state.levelCalls.length;
    controller.zoom("out");
    expect(state.levelCalls).toHaveLength(atMax);
  });

  it("레벨이 바뀌면 알린다 — 핀치로 바뀌어도 같은 길이다", () => {
    const { controller, onLevelChange, pinch } = setup();

    controller.zoom("out");
    expect(onLevelChange).toHaveBeenLastCalledWith(EMPTY_LEVEL + 1);

    pinch(MIN_LEVEL);
    expect(onLevelChange).toHaveBeenLastCalledWith(MIN_LEVEL);
  });
});

describe("정리", () => {
  it("떼면 오버레이와 리스너를 거둔다 — 떠난 화면이 레벨 알림을 받지 않는다", () => {
    const { controller, state, shown, onLevelChange, pinch } = setup();
    controller.showPins(SPREAD);
    controller.dispose();

    expect(shown()).toHaveLength(0);
    expect(state.zoomListeners.size).toBe(0);

    const calls = onLevelChange.mock.calls.length;
    pinch(MAX_LEVEL);
    expect(onLevelChange).toHaveBeenCalledTimes(calls);
  });

  it("상자 크기가 바뀌면 SDK 에 다시 재게 한다", () => {
    const { controller, state } = setup();
    controller.relayout();

    expect(state.relayouts).toBe(1);
  });
});
