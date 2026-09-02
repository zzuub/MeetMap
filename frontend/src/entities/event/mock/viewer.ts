import type { ViewerGender } from "../model/types";

/**
 * 목 모드의 "인증 주체".
 *
 * `eligibleOnly`·`maxPrice`·가격 정렬은 **서버가 인증 주체의 출생연도·성별로
 * 해석하는** 조건이라 쿼리에 성별·출생연도가 실리지 않는다(기능정의서 13장).
 * 백엔드가 없는 동안 그 역할을 이 상수가 대신한다.
 *
 * ⚠️ 목 전용이다. `USE_MOCK=false` 로 내리면 이 파일은 아무데서도 쓰이지 않는다.
 * 게스트 동작(자격 토글·가격 필터·가격 정렬 숨김, `내 나이대` 섹션 숨김)은
 * 화면이 세션으로 판단한다 — 여기서 흉내내지 않는다.
 *
 * P2 에서 프로필이 생기면 목 프로필 저장소로 대체된다.
 */
export const MOCK_VIEWER: { birthYear: number; gender: ViewerGender } = {
  birthYear: 1996,
  gender: "F",
};
