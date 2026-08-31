import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  /** 다중 선택 그룹이면 `true`. 스크린리더에 체크 상태를 알린다. */
  multiple?: boolean;
}

/**
 * 필터·카테고리 칩 (6.2 / 6.4 / 3.4).
 *
 * 선택 상태를 색으로만 구분하지 않도록 `aria-pressed` / `aria-checked` 를 붙인다.
 * 칩 줄은 **가로 스크롤로 만들지 않는다** — 부모에서 `flex-wrap` 을 쓴다 (6.2 원칙).
 */
export function Chip({
  selected = false,
  multiple = false,
  className,
  type = "button",
  ...props
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={multiple ? undefined : selected}
      aria-checked={multiple ? selected : undefined}
      role={multiple ? "checkbox" : undefined}
      className={cn(
        "inline-flex min-h-[38px] items-center justify-center rounded-chip border px-3.5",
        "text-[13px] font-semibold whitespace-nowrap transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-accent bg-active text-text"
          : "border-border bg-surface text-text-sub hover:bg-accent-soft",
        className,
      )}
      {...props}
    />
  );
}
