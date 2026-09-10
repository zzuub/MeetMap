import type { AuthIntent, AuthProvider, Session } from "./types";

/**
 * 인증 계약 (port). 형태는 `EventApi` 와 같다 — 계약은 `model/`, 구현은 `api/`,
 * 분기는 `api/accountApi.ts` 마지막 한 줄 (`decisions.md` 4.3).
 *
 * ⚠️ **`eventApi` 와 한 가지가 다르다.** 조회는 두 모드가 같은 모양(값을 돌려준다)
 * 이지만 **소셜 로그인은 두 세계가 정말 다르다** — 실 모드는 브라우저를 소셜
 * 인증으로 넘기고 세션은 콜백에서 서버가 심는다. 목 모드에는 넘길 곳이 없어
 * 그 자리에서 세션이 생긴다. 그래서 돌려주는 값이 유니온이다 (`decisions.md` 4.43).
 */

export interface StartSignInInput {
  provider: AuthProvider;
  /** 가입 의도. `/onboarding` 은 언제나 `USER` 다 (dev-plan 3.3) */
  intent: AuthIntent;
  /** 로그인 후 돌아갈 앱 내부 경로. **검증을 마친 값**만 넘긴다 (`safeRedirect`) */
  redirectTo: string | null;
}

export type SignInStarted =
  /** 실 모드 — 이 주소로 브라우저를 보낸다. 세션은 콜백에서 서버가 심는다 */
  | { kind: "REDIRECT"; url: string }
  /** 목 모드 — 세션이 이미 만들어졌다. 호출부는 `signInLanding` 으로 갈 곳만 정한다 */
  | { kind: "SESSION"; session: Session };

export interface AccountApi {
  /** 소셜 로그인 시작 (3.1) */
  startSignIn(input: StartSignInInput): Promise<SignInStarted>;

  /**
   * 온보딩의 **필수 구간(약관 동의)** 이 끝났음을 세션에 반영한다 (3.1 `isNewUser`).
   *
   * 프로필은 선택이라(3.3 `나중에 할래요` · 3.4 `건너뛰기`) 여기가 경계다 —
   * 프로필까지 기다리면 건너뛴 사용자가 로그인할 때마다 퍼널로 되돌아온다.
   *
   * ⚠️ **http 구현이 비어 있는 것은 "지금은 연결할 자리가 없다"는 뜻이기도 하다.**
   * 실 모드의 세션 갱신은 `POST /users/me/terms` 를 타야 하는데, 그 호출은 서버→서버
   * fetch 라 응답의 `Set-Cookie` 가 브라우저까지 못 간다 — **실 API 전환 때 이
   * 메서드가 그 갱신을 받는 자리가 될 가능성이 크다.** 두 선택지는
   * `shared/api/endpoints.ts` 의 `user.terms` 에 적어 뒀다 (`decisions.md` 4.50).
   */
  finishSignUp(): Promise<void>;
}
