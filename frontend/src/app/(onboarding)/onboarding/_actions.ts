"use server";

import { redirect } from "next/navigation";
import { safeRedirect, signInLanding } from "@/entities/account";
import { accountApi } from "@/entities/account/server";
import { isSocialProvider } from "./_components/socialProviders";

/**
 * 소셜 로그인 (3.1).
 *
 * Server Action 인 이유는 둘이다. ① 목 모드의 세션 쿠키는 서버만 심을 수 있다
 * ② 실 모드에서는 소셜 인증 주소로 **브라우저를 넘겨야** 한다 — 둘 다 클라이언트
 * `fetch` 로는 못 하는 일이라, 두 모드가 같은 모양이 되는 자리가 여기다.
 *
 * ⚠️ **`?redirect=` 는 여기서만 소비된다.** `proxy.ts` 가 붙여 보낸 값이지만
 * 사용자가 손으로도 고칠 수 있으므로 `safeRedirect` 를 통과한 것만 쓴다
 * (`decisions.md` 4.45).
 */
export async function signInAction(formData: FormData): Promise<void> {
  const provider = formData.get("provider");
  if (!isSocialProvider(provider)) return;

  const raw = formData.get("redirect");
  const redirectTo = safeRedirect(typeof raw === "string" ? raw : null);

  const started = await accountApi.startSignIn({
    provider,
    // `/onboarding` 은 USER 전용 진입점이다. 주최사는 `/provider/signup` (dev-plan 3.3)
    intent: "USER",
    redirectTo,
  });

  // `redirect()` 는 예외를 던져 흐름을 끊는다. try/catch 로 감싸지 않는다.
  if (started.kind === "REDIRECT") redirect(started.url);

  redirect(signInLanding(started.session, redirectTo));
}
