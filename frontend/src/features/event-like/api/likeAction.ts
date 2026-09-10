"use server";

import { revalidatePath } from "next/cache";
import { getAccessToken, getServerSession } from "@/entities/account/server";
import { userApi } from "@/entities/user/server";
import { toActionFailure } from "@/shared/ui";
import type { LikeResult } from "../model/copy";

/**
 * 찜 토글 (7.2 / 9장).
 *
 * **낙관적 업데이트의 뒷면이다.** 화면은 이미 결과를 그렸고 이 함수는 그것을 서버에
 * 반영한다 — 실패하면 되돌리는 것이 아니라 **낙관값을 걷어** 서버 값이 드러나게 한다
 * (`LikeProvider` / `decisions.md` 4.59).
 *
 * ⚠️ **`revalidatePath` 가 이 판의 핵심이다.** 찜을 읽는 화면이 넷이고(홈·탐색·
 * 상세·찜 목록) 어디서 눌러도 나머지가 낡는다. 클라이언트 캐시를 들이는 대신 RSC 를
 * 다시 그리게 한다 (4.58). 경로를 하나씩 적으면 **화면이 늘 때 그 목록을 사람이
 * 갱신해야** 하고, 그게 이 리포가 반복해 틀린 `적용될 자리 세기` 다 (4.51).
 *
 * ⚠️ **세션을 여기서도 본다.** 게스트에게는 버튼이 로그인으로 가지만 그건 화면의
 * 안내이고, 액션은 직접 호출될 수 있다 (4.12 와 같은 태도 — 프론트는 안내하고
 * 서버가 막는다).
 */
export async function toggleLikeAction(
  eventId: string,
  liked: boolean,
): Promise<LikeResult> {
  const session = await getServerSession();
  if (!session) {
    return {
      ok: false,
      failure: {
        code: "AUTH_401",
        occurredAt: new Date().toISOString(),
        title: "로그인이 필요해요",
        description: "찜은 로그인한 뒤에 쓸 수 있어요.",
      },
    };
  }

  try {
    const accessToken = await getAccessToken();
    await userApi.setLike(eventId, liked, { accessToken });
  } catch (error) {
    return { ok: false, failure: toActionFailure(error) };
  }

  revalidatePath("/", "layout");

  return { ok: true };
}
