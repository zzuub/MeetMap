import type { ReactNode } from "react";
import { BottomNav } from "@/widgets/bottom-nav";

/**
 * 하단 4탭 셸 (2.1 / 5.4).
 *
 * 본문 하단 여백은 탭바(68px)와 겹치지 않도록 84~96px을 준다 (2.1).
 * 이 그룹에 속한 화면: `/`, `/explore`, `/likes`, `/my`
 */
export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-shell flex-col bg-bg">
      <main className="flex-1 pb-[92px]">{children}</main>
      <BottomNav />
    </div>
  );
}
