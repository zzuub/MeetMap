"use server";

import { redirect } from "next/navigation";
import { ONBOARDING_STEPS } from "@/entities/account";
import { getAccessToken } from "@/entities/account/server";
import {
  isProfileGender,
  isProfileReady,
  normalizeAreas,
  normalizeBirthYear,
  normalizeNickname,
  type ProfileInput,
} from "@/entities/user";
import { userApi } from "@/entities/user/server";
import { toActionFailure, type ActionFailure } from "@/shared/ui";

/**
 * 프로필 설정 제출 (3.4).
 *
 * **단계가 끝날 때 저장한다** — 2.4 는 온보딩 입력값을 Context 에 들고 마지막
 * 단계에서 일괄 제출한다고 적었지만, 완료 화면(3.5)에는 제출 버튼이 없고
 * `나중에 할래요`(3.3)가 프로필을 건너뛰고 그 화면으로 직행한다. 그리고 3.5 의
 * 동적 문구는 **새로고침을 견뎌야** 한다 (`decisions.md` 4.48).
 */
export async function saveProfileAction(
  _previous: ActionFailure | null,
  formData: FormData,
): Promise<ActionFailure | null> {
  const input = readProfile(formData);

  // 비활성 버튼이 이미 막는다(2.5). 폼을 우회한 제출을 위한 방어선이다.
  if (!input) return null;

  try {
    const accessToken = await getAccessToken();
    await userApi.saveProfile(input, { accessToken });
  } catch (error) {
    return toActionFailure(error);
  }

  redirect(ONBOARDING_STEPS.done);
}

/** 폼 값은 신뢰하지 않는다. 모양이 안 맞으면 `null` 이고 액션은 아무것도 저장하지 않는다. */
function readProfile(formData: FormData): ProfileInput | null {
  const gender = formData.get("gender");
  if (!isProfileGender(gender)) return null;

  const input: ProfileInput = {
    nickname: normalizeNickname(asString(formData.get("nickname"))),
    birthYear: normalizeBirthYear(formData.get("birthYear")),
    gender,
    preferredAreas: normalizeAreas(asString(formData.get("areas")).split(",")),
  };

  return isProfileReady(input) ? input : null;
}

function asString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}
