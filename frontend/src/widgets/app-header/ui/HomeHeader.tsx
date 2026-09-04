"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

interface HomeHeaderProps {
  /** 안읽음 알림이 있으면 아이콘 우상단에 도트 (5-3) */
  hasUnreadNotifications?: boolean;
}

/**
 * 홈 헤더 — 로고 / 검색 / 알림 (5-1 ~ 5-3).
 *
 * 스택 화면의 `AppHeader`(뒤로가기·타이틀·액션)와 성격이 달라 컴포넌트를 나눈다.
 * 높이·배경은 2.1 의 공통 값을 그대로 쓴다.
 */
export function HomeHeader({ hasUnreadNotifications = false }: HomeHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-[var(--height-header)] items-center justify-between px-2",
        "border-b border-border bg-surface/85 backdrop-blur-[10px]",
      )}
    >
      {/* 로고는 이동이 아니라 맨 위로 되돌리기다 — 이미 홈에 있다 (5-1) */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="rounded-chip px-3 py-2 text-[18px] font-bold text-primary"
      >
        MeetMap
      </button>

      <div className="flex items-center">
        <HeaderIconLink href="/search" label="검색">
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <circle cx="11" cy="11" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.9" />
            <path
              d="M15.6 15.6L20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeLinecap="round"
            />
          </svg>
        </HeaderIconLink>

        <HeaderIconLink
          href="/my/notifications"
          // 도트는 색으로만 말한다. 스크린리더에는 라벨로 전한다 (15장)
          label={hasUnreadNotifications ? "알림 — 읽지 않은 알림 있음" : "알림"}
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
            <path
              d="M6.5 10a5.5 5.5 0 1 1 11 0c0 3 .8 4.5 1.5 5.4H5c.7-.9 1.5-2.4 1.5-5.4z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              d="M10 18.4a2.2 2.2 0 0 0 4 0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
          {hasUnreadNotifications ? (
            <span aria-hidden className="absolute top-2.5 right-2.5 size-2 rounded-chip bg-point" />
          ) : null}
        </HeaderIconLink>
      </div>
    </header>
  );
}

/**
 * 아이콘 링크. `IconButton` 을 쓰지 않는 것은 이 둘이 **이동**이기 때문이다 —
 * `<button>` 으로 만들면 새 탭·미리보기 같은 링크의 기본 동작이 사라진다.
 * 터치 타깃 44×44 는 여기서도 지킨다 (15장).
 */
function HeaderIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(
        "relative inline-flex size-11 shrink-0 items-center justify-center rounded-chip",
        "text-primary transition-colors hover:bg-accent-soft",
      )}
    >
      {children}
    </Link>
  );
}
