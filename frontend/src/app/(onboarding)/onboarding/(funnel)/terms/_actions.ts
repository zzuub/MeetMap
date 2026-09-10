"use server";

import { redirect } from "next/navigation";
import { ONBOARDING_STEPS } from "@/entities/account";
import { accountApi, getAccessToken } from "@/entities/account/server";
import { requiredTermsMet, type TermsAgreement } from "@/entities/user";
import { userApi } from "@/entities/user/server";
import { toActionFailure, type ActionFailure } from "@/shared/ui";
import { requireFunnelSession } from "../_guard";

/**
 * 약관 동의 제출 (3.2).
 *
 * 두 entity 를 잇는 자리라 앱 레이어에 있다 — 동의 기록은 `entities/user`,
 * `isNewUser` 는 `entities/account` 의 세션 값이고 둘은 같은 레이어라 서로를
 * 부를 수 없다 (FSD).
 *
 * **여기가 온보딩의 경계다.** 프로필은 선택이므로(3.3·3.4) 약관을 받은 시점에
 * 가입이 끝난 것으로 본다 — 프로필까지 기다리면 건너뛴 사용자가 로그인할 때마다
 * 퍼널로 되돌아온다 (`decisions.md` 4.43).
 */
export async function agreeTermsAction(
  _previous: ActionFailure | null,
  formData: FormData,
): Promise<ActionFailure | null> {
  // 레이아웃 가드가 `<Link>` 이동에서는 안 돈다. 쓰기 직전에 한 번 더 본다 (4.49)
  await requireFunnelSession();

  const agreement = readAgreement(formData);

  // 비활성 버튼이 이미 막는다(2.5). JS 없이 제출된 경우를 위한 방어선이다.
  if (!requiredTermsMet(agreement)) return null;

  try {
    const accessToken = await getAccessToken();
    await userApi.saveTerms(agreement, { accessToken });
    await accountApi.finishSignUp();
  } catch (error) {
    return toActionFailure(error);
  }

  redirect(ONBOARDING_STEPS.intro);
}

/** 체크박스는 켜졌을 때만 `FormData` 에 실린다 — 없는 키가 곧 `false` 다. */
function readAgreement(formData: FormData): TermsAgreement {
  return {
    ageOver19: formData.get("ageOver19") !== null,
    service: formData.get("service") !== null,
    privacy: formData.get("privacy") !== null,
    marketing: formData.get("marketing") !== null,
  };
}
