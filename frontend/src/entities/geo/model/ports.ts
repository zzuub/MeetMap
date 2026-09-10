import type { GeoPoint, ReverseGeocoded } from "./types";

/**
 * 역지오코딩 계약 (port). 형태는 `EventApi`·`AccountApi`·`UserApi` 와 같다 —
 * 계약은 `model/`, 구현은 `api/`, 분기는 `api/geoApi.ts` 마지막 한 줄 (4.3).
 *
 * 슬라이스를 따로 세운 이유는 **소유자가 없기 때문**이다. 좌표→지명 변환은
 * 소개팅의 성질도 사용자의 성질도 아니고, 어느 한쪽 entity 에 넣으면 다른 쪽이
 * 동일 레이어 참조로 막힌다 — `AREAS` 가 `shared/config` 로 올라간 것과 같은
 * 모양의 문제다 (`src/README.md`).
 *
 * ⚠️ **쓰기가 없다.** 좌표는 저장하지 않으므로(4.1) 이 포트는 조회 하나뿐이다.
 */
export interface GeoApi {
  /** 좌표 → 지명 + 지역 마스터 값 (4.2) */
  reverseGeocode(point: GeoPoint): Promise<ReverseGeocoded>;
}
