"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import type { AppliedFilterChip } from "../model/filterChips";

/**
 * 적용 필터 칩 줄 (6.2 · P1-5c).
 *
 * 위치는 시간대 칩 줄 **아래**, 결과 수 **위**다. **조건이 0개면 줄 자체를 그리지
 * 않는다**(높이 0) — 빈 줄이 남으면 상단 컨트롤과 결과 수 사이가 이유 없이 벌어진다.
 *
 * 칩 전체가 해제 링크다. ✕ 만 누르게 하면 히트 영역이 44px 에 못 미치고 칩의 나머지는
 * 눌러도 아무 일이 없는 자리가 된다. 접근 이름은 사양대로 `"{조건명} 필터 해제"` 라서
 * 스크린리더에는 ✕ 버튼과 똑같이 읽힌다.
 *
 * `replace` 인 것은 칩을 몇 번 껐다 켰다고 뒤로가기 스택이 그만큼 쌓이면 홈으로
 * 돌아가는 데 탭을 여러 번 눌러야 하기 때문이다.
 */
interface AppliedFilterChipsProps {
  chips: readonly AppliedFilterChip[];
  /** 칩 줄의 `초기화` 목적지. 칩이 2개 이상일 때만 그린다 (6.2) */
  clearHref: string;
}

const CLEAR_MIN_CHIPS = 2;

export function AppliedFilterChips({ chips, clearHref }: AppliedFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div role="group" aria-label="적용된 필터" className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <FilterLink
          key={chip.key}
          href={chip.href}
          label={chip.removeLabel}
          className="gap-1.5 rounded-chip border border-accent bg-active px-3 text-text"
        >
          {chip.label}
          <RemoveIcon />
        </FilterLink>
      ))}

      {chips.length >= CLEAR_MIN_CHIPS ? (
        <FilterLink
          href={clearHref}
          className="px-1.5 text-text-sub underline underline-offset-2"
        >
          초기화
        </FilterLink>
      ) : null}
    </div>
  );
}

/**
 * 해제 링크 하나.
 *
 * **`prefetch={false}` 가 `useLinkStatus` 와 짝이다.** `/explore` 는 동적 라우트인데
 * `loading.tsx` 가 아직 없어서(P1-9) 누른 뒤 응답까지 화면이 그대로 서 있는다. 그
 * 사이 아무 표시가 없으면 눌리지 않은 것처럼 보이므로 누른 칩만 흐리게 둔다.
 *
 * 칩마다 목적지를 미리 받아두는 것은 낭비다 — 조건 조합마다 다른 동적 페이지고,
 * 사용자는 그중 하나만 누른다.
 */
function FilterLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      prefetch={false}
      aria-label={label}
      className={cn(
        "inline-flex min-h-[38px] items-center text-[13px] font-semibold",
        className,
      )}
    >
      <PendingFade>{children}</PendingFade>
    </Link>
  );
}

/** `useLinkStatus` 는 `Link` 의 **자손**에서만 쓸 수 있다 (Next 16) */
function PendingFade({ children }: { children: ReactNode }) {
  const { pending } = useLinkStatus();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-[inherit] transition-opacity",
        pending && "opacity-40",
      )}
    >
      {children}
    </span>
  );
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5 shrink-0" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
