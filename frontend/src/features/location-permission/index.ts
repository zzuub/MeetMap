/**
 * 위치 권한 3상태 (4장).
 *
 * `useGeolocation` 훅을 따로 두지 않았다 — 요청은 `LocationPermissionGate` 안의
 * 한 함수이고, 훅으로 떼면 상태(3상태·진행·실패)가 두 자리로 나뉜다 (12장 FSD
 * 매핑의 이름과 다른 이유).
 */
export {
  DENIED_BANNER,
  MAP_AXIS_PHRASES,
  PRIVACY_NOTICE,
  REQUIRED_PHRASES,
  deniedReasonFromCode,
} from "./model/copy";
export { countNearby, type CountableEvent } from "./model/counts";
export type {
  DeniedReason,
  LocationResolution,
  NearbyCounts,
  NearbySummary,
} from "./model/types";
export { LocationPermissionGate } from "./ui/LocationPermissionGate";
