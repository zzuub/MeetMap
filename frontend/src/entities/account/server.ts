/**
 * 서버 컴포넌트·Server Action 전용 진입점. `next/headers` 에 의존한다.
 * 클라이언트 컴포넌트에서 임포트하지 않는다.
 *
 * ⚠️ `accountApi` 의 쓰기(`startSignIn`·`finishSignUp`)는 쿠키를 심으므로
 * **Server Action 안에서만** 부를 수 있다. 서버 컴포넌트에서 부르면 Next 가 던진다.
 */
export { accountApi } from "./api/accountApi";
export { getAccessToken, getServerSession } from "./api/getServerSession";
