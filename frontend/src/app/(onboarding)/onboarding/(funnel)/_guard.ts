import { redirect } from "next/navigation";
import { ONBOARDING_STEPS, type Session } from "@/entities/account";
import { getServerSession } from "@/entities/account/server";

/**
 * 퍼널 단계는 세션이 있어야 한다 (3.2~3.5).
 *
 * `PUBLIC_PREFIXES` 가 `/onboarding` **전체**를 게스트에게 열어 둔다 — 로그인
 * 화면이 그 안에 있으니 그래야 한다. 그래서 `checkAccess` 는 `/onboarding/profile`
 * 도 통과시키고, 막는 것은 이 함수뿐이다.
 *
 * ## 부르는 자리가 셋인 이유 (`decisions.md` 4.49)
 *
 * 레이아웃 하나로 끝날 줄 알았는데 **`(funnel)/layout.tsx` 의 재실행이 모든
 * 이동에서 보장되지는 않는다.** 찍어서 확인했다.
 *
 * | 전환 | 레이아웃 재실행 |
 * | --- | --- |
 * | 하드 로드 · 새로고침 · 손으로 친 URL | ✅ 항상 |
 * | Server Action 의 `redirect()` (약관→인트로, 프로필→완료) | ✅ 항상 |
 * | **`<Link>` 소프트 내비게이션** (인트로→프로필, 건너뛰기→완료) | ⚠️ **보장 없음** |
 *
 * 마지막 줄은 두 번 측정해 답이 달랐다 — 한 번은 아예 안 돌았고, 한 번은 (프리페치로
 * 보이는) 호출이 있었다. **타이밍에 기대는 가드는 가드가 아니다.**
 *
 * 그래서 **쓰기를 하는 자리는 액션이 한 번 더 본다.** 폼이 그려지는 것까지는 못
 * 막지만(세션이 화면 위에서 죽는 경우다), 세션 없이 저장이 일어나거나 실 모드에서
 * 401 이 `정보를 불러오지 못했어요` 로 잘못 안내되는 것은 막는다.
 *
 * 규칙의 **구현은 이 함수 하나**다. 부르는 자리를 늘리더라도 판정을 복사하지 않는다.
 */
export async function requireFunnelSession(): Promise<Session> {
  const session = await getServerSession();
  if (!session) redirect(ONBOARDING_STEPS.login);

  return session;
}
