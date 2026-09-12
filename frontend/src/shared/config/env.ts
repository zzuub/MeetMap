/**
 * 환경 변수 접근 지점.
 *
 * `process.env` 를 다른 곳에서 직접 읽지 않는다. Next.js는 `NEXT_PUBLIC_*` 를
 * 빌드 타임에 문자열 치환하므로, 동적 접근(`process.env[key]`)은 동작하지 않는다.
 * 반드시 이 파일처럼 리터럴로 참조해야 한다.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/**
 * 목 데이터 모드.
 *
 * 백엔드가 아직 비어 있으므로(Spring 스켈레톤만 존재) 기본값은 켜짐이다.
 * 실 API가 뜨면 `.env` 에서 `false` 로 내린다. 화면 코드는 이 값을 몰라야 하고,
 * 분기는 `entities/*\/api/*Api.ts` 한 곳에서만 일어난다. (dev-plan P0-6)
 */
export const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

/** 목 응답에 걸어줄 인위적 지연(ms). 스켈레톤·로딩 상태를 실제로 보기 위한 값. */
export const MOCK_LATENCY_MS = 300;

/**
 * 카카오맵 JavaScript 키 (P3-1 · `decisions.md` 4.71).
 *
 * **브라우저에 그대로 드러나는 값이다** — 막는 수단은 키가 아니라 카카오 콘솔의 도메인
 * 등록이다. 비어 있으면(CI · 키 없는 머신) 지도는 SDK 를 부르지 않고 `MAP_KEY_MISSING`
 * 카드를 그린다. 테스트·빌드는 키 없이 통과한다.
 */
export const KAKAO_MAP_APP_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";
