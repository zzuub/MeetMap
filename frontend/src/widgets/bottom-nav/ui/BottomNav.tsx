"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";

interface TabItem {
  href: string;
  /** 활성 판정용 경로 프리픽스. `href` 에 쿼리가 붙는 탭 때문에 따로 둔다. */
  match: string;
  label: string;
  icon: ReactNode;
}

/**
 * 하단 4탭 (5.4 / 2.1).
 *
 * 활성 표시는 **도트 + 라벨 볼드**다 (색상만으로 구분하지 않는다, 15장).
 * 목업 우하단의 플로팅 탭바(`상세·신청 / 비교 / 찜`)는 프로토타입 화면 전환 장치이지
 * 제품 기능이 아니므로 여기에 넣지 않는다(기능정의서 작성 원칙 2).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-shell items-stretch",
        "h-[var(--height-bottom-nav)] border-t border-border",
        "bg-surface/85 backdrop-blur-[10px] pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {TABS.map((tab) => {
        const active =
          tab.match === "/"
            ? pathname === "/"
            : pathname === tab.match || pathname.startsWith(`${tab.match}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className="flex flex-1 flex-col items-center justify-center gap-1"
          >
            <span
              className={cn(
                "relative flex size-6 items-center justify-center",
                active ? "text-primary" : "text-text-sub",
              )}
            >
              {tab.icon}
            </span>
            <span
              className={cn(
                "text-[11px]",
                active ? "font-bold text-primary" : "font-medium text-text-sub",
              )}
            >
              {tab.label}
            </span>
            <span
              aria-hidden
              className={cn(
                "size-1 rounded-chip transition-colors",
                active ? "bg-accent" : "bg-transparent",
              )}
            />
          </Link>
        );
      })}
    </nav>
  );
}

const TABS: TabItem[] = [
  {
    href: "/",
    match: "/",
    label: "홈",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/explore?view=map",
    match: "/explore",
    label: "지도",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
        <path
          d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    href: "/likes",
    match: "/likes",
    label: "찜",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
        <path
          d="M12 20s-7.2-4.6-7.2-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.2 2.4C19.2 15.4 12 20 12 20z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/my",
    match: "/my",
    label: "마이",
    icon: (
      <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden>
        <circle cx="12" cy="8.5" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M4.8 20c.6-3.6 3.6-5.6 7.2-5.6s6.6 2 7.2 5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];
