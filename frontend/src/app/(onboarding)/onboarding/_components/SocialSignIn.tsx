"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/shared/lib";
import { signInAction } from "../_actions";
import { SOCIAL_PROVIDERS } from "./socialProviders";

/**
 * 소셜 로그인 버튼 3종 (3.1).
 *
 * 폼 하나에 제출 버튼 셋이다 — 누른 버튼의 `name`/`value` 만 `FormData` 에 실리므로
 * 어느 소셜을 눌렀는지 액션이 그대로 읽는다. JS 없이도 동작한다.
 *
 * **누른 자리에 전환 표시를 붙인다** (P1-5 에서 굳은 규칙). `useFormStatus().data` 가
 * 제출 중인 `FormData` 를 주므로 셋 중 어느 것이 진행 중인지 구분할 수 있다.
 */
export function SocialSignIn({ redirectTo }: { redirectTo: string | null }) {
  return (
    <form action={signInAction} className="flex w-full flex-col gap-2.5">
      {/* 로그인 후 돌아갈 곳. 검증은 액션의 `safeRedirect` 가 한다 */}
      <input type="hidden" name="redirect" value={redirectTo ?? ""} />

      {SOCIAL_PROVIDERS.map((provider) => (
        <SocialButton key={provider.code} provider={provider} />
      ))}
    </form>
  );
}

function SocialButton({
  provider,
}: {
  provider: (typeof SOCIAL_PROVIDERS)[number];
}) {
  const { pending, data } = useFormStatus();
  const mine = pending && data?.get("provider") === provider.code;

  return (
    <button
      type="submit"
      name="provider"
      value={provider.code}
      disabled={pending}
      className={cn(
        "inline-flex min-h-[48px] w-full items-center justify-center rounded-button",
        "px-5 text-[15px] font-bold transition-opacity disabled:cursor-not-allowed",
        pending && !mine && "opacity-50",
        provider.className,
      )}
    >
      {mine ? "이동 중..." : provider.label}
    </button>
  );
}
