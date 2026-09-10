/**
 * 서버 컴포넌트·Server Action 전용 진입점.
 *
 * 목 구현이 쿠키를 저장소로 쓰므로 `next/headers` 에 의존한다 — 배럴(`index.ts`)에
 * 두면 타입 하나 때문에 이 모듈을 임포트한 클라이언트 컴포넌트가 빌드에서 깨진다.
 * `entities/account/server.ts` 와 같은 이유다.
 *
 * ⚠️ 쓰기(`saveTerms`·`saveProfile`)는 **Server Action 안에서만** 부를 수 있다.
 */
export { userApi } from "./api/userApi";
