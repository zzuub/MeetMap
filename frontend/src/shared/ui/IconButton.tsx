import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 아이콘만 있으므로 필수다. 없으면 스크린리더가 읽을 게 없다. */
  label: string;
}

/**
 * 아이콘 전용 버튼 (헤더 액션, 찜 버튼 등).
 *
 * **터치 타깃 최소 44×44px** (15장). 목업의 찜 버튼은 26~30px이라 그대로 옮기면
 * 접근성 기준 미달이다. 시각적 원은 작게 두되 히트 영역은 이 컴포넌트가 확보한다.
 */
export function IconButton({
  label,
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-chip",
        "text-primary transition-colors hover:bg-accent-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
