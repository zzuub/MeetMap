"use client";

import { cn } from "../lib/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** 스크린리더용 이름. 시각적 라벨이 따로 있으면 그 텍스트를 그대로 넣는다. */
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * 스위치 토글 (10.3 알림 설정, 6.4 `20대 위주`).
 *
 * `role="switch"` 를 쓴다 (15장). 알림 설정의 토글은 **즉시 저장**이고
 * 실패 시 롤백 + 토스트가 원칙이므로, 이 컴포넌트는 상태를 자체 보관하지 않는다.
 */
export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[30px] w-[52px] shrink-0 items-center rounded-chip",
        "transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-primary" : "bg-disabled-bg",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute size-[24px] rounded-chip bg-surface transition-[left] duration-150",
          checked ? "left-[25px]" : "left-[3px]",
        )}
      />
    </button>
  );
}
