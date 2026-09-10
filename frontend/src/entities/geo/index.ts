/**
 * 좌표 ↔ 지명 (4.2).
 *
 * `server.ts` 를 두지 않는다 — 쿠키를 쓰지 않으므로 서버·클라이언트 어디서든
 * 안전하다. 다만 좌표를 다루는 자리라 **호출은 서버 액션 안에서만** 한다
 * (`decisions.md` 4.54 — 좌표가 클라이언트 번들의 URL 로 새 나가지 않게).
 */
export { geoApi } from "./api/geoApi";
export { nearestArea } from "./model/nearestArea";
export type { GeoApi } from "./model/ports";
export type { GeoPoint, ReverseGeocoded } from "./model/types";
