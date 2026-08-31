"use client";

import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  children: ReactNode;
  /** 우측 보조 액션 (예: 약관 `자세히 보기`) */
  trailing?: ReactNode;
  className?: string;
}

/**
 * 체크박스 + 라벨 (3.2 약관 동의).
 *
 * 라벨 영역 전체가 클릭 타깃이다(목업 동작). 실제 `input` 을 쓰되 시각적으로 숨기고
 * 커스텀 박스를 그린다 — `div + onClick` 으로 만들면 키보드·스크린리더가 못 쓴다 (15장).
 */
export function Checkbox({
  checked,
  onChange,
  children,
  trailing,
  className,
}: CheckboxProps) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <label
        htmlFor={id}
        className="flex min-h-11 flex-1 cursor-pointer items-center gap-2.5 text-[14px] text-text"
      >
        <span
          aria-hidden
          className={cn(
            "flex size-[22px] shrink-0 items-center justify-center rounded-[7px] border transition-colors",
            checked
              ? "border-primary bg-primary text-surface"
              : "border-border bg-surface text-transparent",
          )}
        >
          <svg viewBox="0 0 24 24" className="size-3.5">
            <path
              d="M5 12.5l4.5 4.5L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {children}
      </label>
      {trailing}
    </div>
  );
}
