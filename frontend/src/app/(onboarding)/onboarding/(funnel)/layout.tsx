import type { ReactNode } from "react";
import { requireFunnelSession } from "./_guard";

/**
 * 온보딩 퍼널 단계의 세션 가드 (3.2~3.5).
 *
 * 판정은 `_guard.ts` 한 곳이다. ⚠️ **이 레이아웃의 재실행은 모든 이동에서
 * 보장되지 않는다** — `<Link>` 소프트 내비게이션이 그렇다(측정했다). 그래서
 * **세션에 딸린 일을 하는 단계는 같은 함수를 스스로 한 번 더 부른다**
 * (`decisions.md` 4.49 — 어느 단계가 그런지는 `_guard.ts` 의 표에 넷 다 있다).
 *
 * 그래도 가드를 화면마다 적지 않고 여기 두는 이유는, 단계가 늘어도(예: P2-6 위치
 * 권한) **폴더에 넣기만 하면 최소한 진입 경로에는 같은 규칙이 걸리게** 하려는
 * 것이다. 새 단계가 세션에 딸린 일을 하면 거기서 `requireFunnelSession` 을 부른다.
 *
 * 라우트 그룹이라 URL 은 그대로 `/onboarding/terms` 다. 시각적으로는 아무것도
 * 얹지 않는다 — 셸은 `(onboarding)/layout.tsx` 가 이미 잡았다.
 */
export default async function OnboardingFunnelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireFunnelSession();

  return <>{children}</>;
}
