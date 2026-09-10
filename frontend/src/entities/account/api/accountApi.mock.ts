// 서버 전용 모듈이다. Server Action 안에서만 쿠키를 쓸 수 있으므로
// `startSignIn`·`finishSignUp` 은 액션에서만 부른다.
import { cookies } from "next/headers";
import { MOCK_LATENCY_MS } from "@/shared/config";
import type { AccountApi, SignInStarted, StartSignInInput } from "../model/ports";
import {
  MOCK_SESSION_COOKIE,
  readMockSessionCookie,
  serializeMockSession,
} from "../model/session";
import type { Session } from "../model/types";

/**
 * 목 모드의 인증 (P2-1).
 *
 * 백엔드에 OAuth 가 없으므로 **세션을 프론트가 만든다.** 소셜 인증 자체는
 * 흉내내지 않는다 — 어차피 흉내낼 수 있는 것은 "인증에 성공했다" 한 가지뿐이고,
 * 그 뒤의 분기(`isNewUser`)가 퍼널이 실제로 검증해야 하는 것이다.
 *
 * ⚠️ **`meetmap_mock_role` 을 건드리지 않는다.** 그 쿠키는 개발용 역할 스위치이고
 * 거기서 나온 세션은 `isNewUser` 가 항상 거짓이다 (`model/session.ts`).
 */
const COOKIE_OPTIONS = {
  path: "/",
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
} as const;

export const mockAccountApi: AccountApi = {
  async startSignIn({ provider, intent }: StartSignInInput): Promise<SignInStarted> {
    await delay();

    const store = await cookies();
    const existing = readMockSessionCookie(store.get(MOCK_SESSION_COOKIE)?.value);

    // 이미 가입해 둔 브라우저면 그 세션을 그대로 되쓴다 — 그래야 3.1 의
    // `기존 회원은 홈으로` 분기가 실제로 돈다. 처음부터 다시 보려면 쿠키를 지운다.
    const session: Session = existing ?? newAccount(provider, intent);

    store.set(MOCK_SESSION_COOKIE, serializeMockSession(session), COOKIE_OPTIONS);
    return { kind: "SESSION", session };
  },

  async finishSignUp() {
    await delay();

    const store = await cookies();
    const session = readMockSessionCookie(store.get(MOCK_SESSION_COOKIE)?.value);
    if (!session) return;

    store.set(
      MOCK_SESSION_COOKIE,
      serializeMockSession({ ...session, isNewUser: false }),
      COOKIE_OPTIONS,
    );
  },
};

function newAccount(
  provider: StartSignInInput["provider"],
  intent: StartSignInInput["intent"],
): Session {
  // 주최사 가입은 심사 대기로 떨어진다 (dev-plan 3.3). `/onboarding` 은 USER 만 보낸다.
  const isProvider = intent === "PROVIDER";

  return {
    accountId: `mock-${provider.toLowerCase()}`,
    role: isProvider ? "PROVIDER" : "USER",
    status: isProvider ? "PENDING" : "ACTIVE",
    isNewUser: true,
    nickname: null,
  };
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
