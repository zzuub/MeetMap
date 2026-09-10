import { ENDPOINTS } from "@/shared/api";
import { API_BASE_URL, USE_MOCK } from "@/shared/config";
import type { AccountApi, StartSignInInput } from "../model/ports";
import { mockAccountApi } from "./accountApi.mock";

/**
 * 실 API 구현과 목 구현의 분기 지점 (dev-plan P0-6 / `decisions.md` 4.3).
 *
 * 계약은 `model/ports.ts` 의 `AccountApi`. 백엔드 OAuth 가 뜨면
 * `NEXT_PUBLIC_USE_MOCK=false` 로 내리는 것으로 전환이 끝난다.
 */
const httpAccountApi: AccountApi = {
  // OAuth 는 fetch 가 아니라 **브라우저 이동**이다. 여기서는 갈 주소만 만든다.
  startSignIn: async (input) => ({ kind: "REDIRECT", url: authorizeUrl(input) }),

  // 서버가 약관 POST 를 받을 때 `isNewUser` 를 내리고 새 토큰을 `Set-Cookie` 로
  // 심는다. 프론트가 할 일이 없어 비어 있다 — **그 계약은 `ENDPOINTS.user.terms`
  // 에 적혀 있고, 안 지켜지면 프론트가 알아챌 방법이 없다** (PR #35 리뷰).
  finishSignUp: async () => {},
};

/**
 * 소셜 인증 시작 주소.
 *
 * ⚠️ **역할 의도(`intent`)를 서명하는 것은 서버다.** 여기서 넘기는 값은 힌트일 뿐
 * 이고, 서버가 서명된 `state` 로 바꿔 소셜에 넘긴다. 콜백 바디의 `role` 을 믿으면
 * `role: "ADMIN"` 한 줄이 권한 상승이 된다 (dev-plan 3.3 / `decisions.md` 4.5).
 */
function authorizeUrl({ provider, intent, redirectTo }: StartSignInInput): string {
  const url = new URL(
    `${API_BASE_URL.replace(/\/$/, "")}${ENDPOINTS.auth.oauth(provider.toLowerCase())}`,
  );
  url.searchParams.set("intent", intent);
  if (redirectTo) url.searchParams.set("redirect", redirectTo);
  return url.toString();
}

export const accountApi: AccountApi = USE_MOCK ? mockAccountApi : httpAccountApi;
