import type { ReactNode } from "react";

/**
 * 온보딩 셸 — 하단 탭 없음, 전체화면 + 하단 시트 레이아웃 (1.1 / 3장).
 *
 * 이 그룹에 속한 화면:
 * `/onboarding`(로그인) → `/terms` → `/intro` → `/profile` → `/done` → `/location`
 */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-shell flex-col bg-bg">
      {children}
    </div>
  );
}
