import type { Area } from "@/shared/config";

/** 근거: docs/spec/03-온보딩-위치권한.md 4.2 (역지오코딩) */

/**
 * 위경도 한 점.
 *
 * ⚠️ **저장하지 않는다.** 4.1 이 `위치 정보는 소개팅 추천에만 사용되며 저장되지
 * 않습니다` 를 고정 문구로 못 박았다. 이 값의 수명은 `권한 허용 → 역지오코딩 →
 * 건수 조회 → 화면` 한 번뿐이고, 쿠키·URL·서버 어디에도 남지 않는다
 * (`decisions.md` 4.54).
 */
export interface GeoPoint {
  lat: number;
  lng: number;
}

/**
 * 좌표를 사람이 읽는 지명과 **앱이 쓸 수 있는 축**으로 되돌린 값.
 *
 * 둘을 나눠 두는 것이 요점이다.
 * - `label` 은 보여주기 위한 것이라 실 API 가 행정동까지 내려준다(`서울 성동구 성수동`).
 *   목은 지역 마스터 라벨(`성수·건대`)을 그대로 쓴다 — 목에 행정동 데이터가 없다.
 * - `area` 는 **행동하기 위한 것**이다. `EventListQuery.area` 축과 같은 값이라
 *   `주변 소개팅 보기` 가 이 값으로 주소를 만든다. 마스터 밖이면 `null` 이고,
 *   그때 화면은 지역을 좁히지 않는다 (`decisions.md` 4.53).
 */
export interface ReverseGeocoded {
  label: string;
  area: Area | null;
}
