/**
 * 카카오맵 JavaScript SDK 에서 **이 슬라이스가 쓰는 표면만** 좁게 적은 타입
 * (6.7 · `decisions.md` 4.71).
 *
 * 타입 패키지를 들이지 않았다 — 쓰는 표면이 작고, 넓은 타입은 쓰지 않는 API 까지 쓸 수
 * 있다고 말한다. 여기 없는 API 가 필요하면 **먼저 여기에 적는다.**
 *
 * ⚠️ 테스트는 이 선언을 흉내 낸 가짜 SDK 로 돈다 — 선언이 실물과 어긋나면 테스트는 모른다.
 * 실물과의 대조는 키가 있는 브라우저에서만 된다 (4.71 `브라우저로만 확인`).
 */

export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoLatLngBounds {
  extend(latlng: KakaoLatLng): void;
}

/** 레벨은 **작을수록 확대**다 — 1 이 가장 가깝다 */
export interface KakaoMap {
  getLevel(): number;
  setLevel(level: number, options?: { animate?: boolean }): void;
  setMinLevel(level: number): void;
  setMaxLevel(level: number): void;
  setCenter(latlng: KakaoLatLng): void;
  setBounds(
    bounds: KakaoLatLngBounds,
    paddingTop?: number,
    paddingRight?: number,
    paddingBottom?: number,
    paddingLeft?: number,
  ): void;
  /** 지도를 담은 상자의 크기가 바뀐 뒤에 불러야 한다 — SDK 는 스스로 다시 재지 않는다 */
  relayout(): void;
}

export interface KakaoCustomOverlayOptions {
  position: KakaoLatLng;
  content: HTMLElement;
  /** 0~1 — 내용의 어느 점이 좌표에 오나 */
  xAnchor?: number;
  yAnchor?: number;
  /** `true` 면 내용 위의 클릭이 지도 이벤트(드래그 시작 등)로 새지 않는다 */
  clickable?: boolean;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
}

export type KakaoMapEvent = "zoom_changed";

export interface KakaoMapsApi {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level: number },
  ) => KakaoMap;
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
  event: {
    addListener(target: KakaoMap, type: KakaoMapEvent, handler: () => void): void;
    removeListener(target: KakaoMap, type: KakaoMapEvent, handler: () => void): void;
  };
  /** `autoload=false` 로 부른 SDK 의 본체를 불러온다. 콜백 뒤에야 위 생성자들이 생긴다 */
  load(callback: () => void): void;
}

/** 스크립트만 뜨고 본체는 아직인 모양 — 이때는 `load` 뿐이다 */
export type KakaoMapsShell = Partial<KakaoMapsApi> & Pick<KakaoMapsApi, "load">;

declare global {
  interface Window {
    /** SDK 스크립트가 스스로 심는 전역. 로드 전에는 없다 */
    kakao?: { maps: KakaoMapsShell };
  }
}
