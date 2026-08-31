/**
 * 서버 컴포넌트 전용 진입점. `next/headers` 에 의존한다.
 * 클라이언트 컴포넌트에서 임포트하지 않는다.
 */
export { getAccessToken, getServerSession } from "./api/getServerSession";
