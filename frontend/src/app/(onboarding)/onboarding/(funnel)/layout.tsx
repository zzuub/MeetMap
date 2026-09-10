import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { ONBOARDING_STEPS } from "@/entities/account";
import { getServerSession } from "@/entities/account/server";

/**
 * 온보딩 퍼널 4단계의 세션 가드 (3.2~3.5).
 *
 * `PUBLIC_PREFIXES` 는 `/onboarding` **전체**를 게스트에게 열어 둔다 — 로그인
 * 화면이 그 안에 있으니 그래야 한다. 그래서 `checkAccess` 는 `/onboarding/profile`
 * 도 통과시키고, **손으로 친 URL 로 세션 없이 프로필 폼에 도달할 수 있었다.**
 *
 * 가드를 화면 넷에 각각 적지 않고 이 레이아웃 하나에 두는 이유는, 나중에 단계가
 * 늘어도(예: P2-6 위치 권한) 폴더 안에 넣기만 하면 같은 규칙이 걸리게 하려는
 * 것이다 — 규칙을 만들고 적용될 자리를 세는 일을 사람이 안 하도록 (4.45).
 *
 * 라우트 그룹이라 URL 은 그대로 `/onboarding/terms` 다. 시각적으로는 아무것도
 * 얹지 않는다 — 셸은 `(onboarding)/layout.tsx` 가 이미 잡았다.
 */
export default async function OnboardingFunnelLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect(ONBOARDING_STEPS.login);

  return <>{children}</>;
}
