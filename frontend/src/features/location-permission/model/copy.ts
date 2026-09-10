import type { LocationPermissionState } from "@/entities/user";
import type { DeniedReason } from "./types";

/** 근거: docs/spec/03-온보딩-위치권한.md 4장 · 02-공통규칙.md 2.5 */

/**
 * 4.1 이 **고정 문구**로 못 박은 개인정보 고지.
 *
 * 화면에 리터럴로 박지 않는 이유는 `event-apply` 의 법적 고지와 같다 — 문구가
 * 실제로 그려지는지 테스트가 확인해야 하고, 상수만 잠그면 JSX 에서 조용히 감추는
 * 변경을 못 잡는다 (`decisions.md` 4.39).
 *
 * ⚠️ **이 문구가 화면의 저장 범위를 정한다.** 좌표는 어디에도 남기지 않는다.
 * `denied` 의 활동 지역은 좌표가 아니라 사용자가 고른 선호 지역이라 저장한다
 * (`decisions.md` 4.53·4.54).
 */
export const PRIVACY_NOTICE =
  "위치 정보는 소개팅 추천에만 사용되며 저장되지 않습니다";

/**
 * 상태마다 **반드시 그려져야 하는 문구** (4.1~4.3).
 *
 * `Record<LocationPermissionState, …>` 라 상태가 늘면 컴파일 에러다. 세 상태를
 * 한 표로 적어 두는 것이 요점이다 — 이번 판의 실수 패턴이 "규칙을 만들고 적용될
 * 자리를 안 센 것"이었다 (`decisions.md` 4.51).
 *
 * `denied` 는 사유가 셋이라 배너 제목이 갈린다. 그래서 여기에는 **사유와 무관하게
 * 늘 있어야 하는 것**만 적고, 제목 셋은 `DENIED_BANNER` 가 잠근다.
 */
export const REQUIRED_PHRASES: Record<
  LocationPermissionState,
  readonly string[]
> = {
  asking: [PRIVACY_NOTICE, "위치 정보 허용하기", "지역 직접 선택할게요"],
  granted: ["기준으로 주변 소개팅", "주변 소개팅 보기"],
  denied: ["활동 지역", "위치 권한 다시 허용하기"],
};

/**
 * `denied` 사유별 배너 (4.3 경고 배너).
 *
 * ⚠️ **제약 안내에 `거리순 정렬·지도 자동 이동 불가` 를 쓰지 않았다.** 4.3 이
 * 그렇게 적었지만 지금은 **권한을 허용해도** 거리순 정렬이 없고 지도도 없다 —
 * 없는 기능을 "권한이 꺼져서 못 쓴다"고 하면 거짓말이다. P3-1 이 그 축을 만들 때
 * 이 문구로 되돌린다 (`decisions.md` 4.56 — 되돌릴 문구는 `MAP_AXIS_PHRASES` 에
 * 적혀 있고 테스트가 양방향으로 잠근다).
 */
export const DENIED_BANNER: Record<
  DeniedReason,
  { title: string; body: string }
> = {
  PERMISSION: {
    title: "위치 권한이 꺼져 있어요",
    body: "주변 소개팅을 자동으로 찾아드릴 수 없어요. 활동 지역을 골라주시면 그 지역 기준으로 보여드릴게요",
  },
  UNAVAILABLE: {
    title: "위치를 확인하지 못했어요",
    body: "권한은 켜져 있지만 현재 위치를 잡지 못했어요. 활동 지역을 직접 골라주세요",
  },
  UNSUPPORTED: {
    title: "이 브라우저는 위치를 지원하지 않아요",
    body: "위치 기능을 쓸 수 없는 환경이에요. 활동 지역을 직접 골라주세요",
  },
};

/**
 * **P3-1 이 거리·지도 축을 만들 때 되돌릴 문구** (4.1 혜택 ①② · 4.2 반경 ·
 * 4.3 제약 안내).
 *
 * 지금 이 문구를 쓰면 사용자에게 없는 기능을 약속한다 — `SORT_OPTIONS` 에 거리순이
 * 없고 `EventListQuery` 에 좌표 축이 없다. 목록으로 남겨 두는 이유는 **P3-1 이
 * 이것을 다시 찾아야 하기 때문**이고, 찾는 일은 사람이 아니라 테스트가 한다
 * (`copy.test.tsx` 가 거리 축의 유무로 양방향 단언한다 — `decisions.md` 4.56).
 */
export const MAP_AXIS_PHRASES = [
  "거리순 정렬",
  "반경 3km",
  "지도 중심 자동 설정",
  "지도 자동 이동",
] as const;

/**
 * `GeolocationPositionError.code` → 사유.
 *
 * 표준은 `1 PERMISSION_DENIED` · `2 POSITION_UNAVAILABLE` · `3 TIMEOUT` 셋이지만
 * **모르는 코드에도 답이 있어야 한다** — 상수 비교로 적고 나머지는 `UNAVAILABLE`
 * 로 떨어뜨린다. 모르는 실패를 `PERMISSION` 으로 읽으면 사용자를 설정 화면으로
 * 보내 놓고 켤 것이 없게 만든다.
 *
 * `TIMEOUT` 을 `UNAVAILABLE` 과 한 문구로 묶는다 — 사용자가 할 일이 같다(기다리거나
 * 지역을 고른다). 사유를 넷으로 늘리면 문구 둘이 같은 표가 된다.
 */
export function deniedReasonFromCode(code: number): DeniedReason {
  return code === PERMISSION_DENIED ? "PERMISSION" : "UNAVAILABLE";
}

/** `GeolocationPositionError.PERMISSION_DENIED`. 상수를 읽으려면 인스턴스가 필요하다 */
const PERMISSION_DENIED = 1;
