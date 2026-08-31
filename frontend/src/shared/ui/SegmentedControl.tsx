"use client";

import { useRef } from "react";
import { cn } from "../lib/cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: readonly SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** 스크린리더용 그룹 이름. 예: "보기 방식" */
  label: string;
  className?: string;
}

/**
 * 리스트/지도 뷰 토글 같은 단일 선택 세그먼트 (6.2).
 *
 * `radiogroup` 시맨틱 + roving tabindex 를 쓴다 (15장).
 *
 * roving tabindex 는 선택된 항목만 `tabIndex=0` 이고 나머지는 `-1` 이다.
 * 따라서 화살표로 선택을 옮기면 **포커스도 같이 옮겨야 한다.** 옮기지 않으면
 * 방금까지 포커스를 갖고 있던 요소가 `tabIndex=-1` 이 되어 탭 순서에서 빠지고,
 * 다음 Tab 에 그룹 밖으로 튕긴다 (WAI-ARIA radiogroup 패턴).
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);

  const move = (delta: number) => {
    const index = options.findIndex((o) => o.value === value);
    const nextIndex = (index + delta + options.length) % options.length;
    onChange(options[nextIndex].value);

    // 리렌더를 기다리지 않아도 DOM 노드는 이미 존재하므로 바로 포커스를 옮긴다.
    containerRef.current
      ?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
      [nextIndex]?.focus();
  };

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex rounded-chip border border-border bg-surface p-1",
        className,
      )}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          event.preventDefault();
          move(1);
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-[36px] rounded-chip px-4 text-[13px] font-semibold transition-colors",
              selected
                ? "bg-accent text-text"
                : "bg-transparent text-text-sub hover:bg-accent-soft",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
