/**
 * 클라이언트·엣지·서버 어디서든 안전한 공개 API.
 *
 * `next/headers` 에 의존하는 서버 전용 함수는 여기서 내보내지 않는다.
 * 클라이언트 컴포넌트가 타입 하나 때문에 이 배럴을 임포트했다가 서버 모듈까지
 * 끌고 오면 빌드가 깨진다. 서버 전용은 `@/entities/account/server` 를 쓴다
 * (`accountApi` 가 그렇다 — 쿠키를 쓴다).
 */
export {
  ACCESS_RULES,
  checkAccess,
  findAccessRule,
  isPublicPath,
  PUBLIC_PREFIXES,
  type AccessDecision,
  type AccessRule,
} from "./model/access";
export {
  AFTER_ONBOARDING,
  ONBOARDING_ROOT,
  ONBOARDING_STEPS,
  safeRedirect,
  signInLanding,
} from "./model/landing";
export type {
  AccountApi,
  SignInStarted,
  StartSignInInput,
} from "./model/ports";
export {
  MOCK_ROLE_COOKIE,
  MOCK_SESSION_COOKIE,
  readMockSession,
  readMockSessionCookie,
  readSession,
  readSessionFromToken,
  SESSION_COOKIE,
  serializeMockSession,
  type CookieReader,
} from "./model/session";
export {
  AUTH_INTENTS,
  isAllowedAuthIntent,
  type Account,
  type AuthIntent,
  type AuthProvider,
  type Membership,
  type MembershipStatus,
  type Role,
  type Session,
} from "./model/types";
