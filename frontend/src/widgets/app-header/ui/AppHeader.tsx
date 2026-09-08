"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { IconButton } from "@/shared/ui";
import { cn } from "@/shared/lib";

interface AppHeaderProps {
  title?: string;
  /** 우측 액션 (공유, 설정, 편집 등) */
  action?: ReactNode;
  /** 뒤로가기 대신 특정 경로로 보낼 때 */
  backHref?: string;
  className?: string;
}

/**
 * 스택 화면용 헤더 (2.1).
 *
 * 56px, `sticky top-0`, 반투명 + blur. `(stack)` 라우트 그룹의 공통 셸이다.
 * 홈의 헤더(로고·검색·알림)는 성격이 달라 별도 위젯으로 만든다(Phase 1).
 */
export function AppHeader({ title, action, backHref, className }: AppHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--height-header)] items-center gap-1 px-2",
        "border-b border-border bg-surface/85 backdrop-blur-[10px]",
        className,
      )}
    >
      <IconButton
        label="뒤로 가기"
        onClick={() => (backHref ? router.push(backHref) : router.back())}
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path
            d="M15 5l-7 7 7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </IconButton>

      {/* ⚠️ `title` 없이 쓰는 화면은 **자기 `h1` 을 반드시 하나 가져야 한다** — 타입이
          강제하지 못하는 절반이다. 근거는 `decisions.md` 4.34 */}
      {title ? (
        <h1 className="min-w-0 flex-1 truncate text-center text-[16px] font-bold text-primary">
          {title}
        </h1>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      {/* 타이틀을 가운데 정렬로 유지하기 위해 액션이 없어도 자리를 비워둔다 */}
      <div className="flex min-w-11 justify-end">{action}</div>
    </header>
  );
}
