import type { ReactNode } from "react";
import { requireFunnelSession } from "./_guard";

/**
 * 온보딩 퍼널 단계의 세션 가드 (3.2~3.5).
 *
 * 판정은 `_guard.ts` 한 곳이다. ⚠️ **이 레이아웃이 모든 이동에서 다시 도는 것은
 * 아니다** — `<Link>` 소프트 내비게이션에서는 안 돈다(측정했다). 그래서 쓰기를
 * 하는 액션이 같은 함수를 한 번 더 부른다 (`decisions.md` 4.49).
 *
 * 그래도 가드를 화면마다 적지 않고 여기 두는 이유는, 단계가 늘어도(예: P2-6 위치
 * 권한) **폴더에 넣기만 하면 최소한 진입 경로에는 같은 규칙이 걸리게** 하려는
 * 것이다. 새 단계가 쓰기를 하면 그 액션에서 `requireFunnelSession` 을 부른다.
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
