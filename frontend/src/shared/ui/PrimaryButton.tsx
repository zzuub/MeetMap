import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost";

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

/**
 * 주 액션 버튼 (2.2 / 2.5).
 *
 * 두 가지 규칙이 코드로 강제된다.
 * 1. `accent` 배경 위 텍스트는 항상 `text-text`(짙은 블랙)다. 흰 텍스트는 대비 1.6:1로
 *    WCAG 미달이라 금지된다.
 * 2. 비활성 상태에서 별도 에러 토스트를 띄우지 않는다. **라벨이 미충족 사유를 말한다.**
 *    (`동의하고 계속하기` ↔ `필수 약관에 동의해주세요`) 그래서 `disabled` 여도
 *    라벨은 그대로 읽혀야 하므로 텍스트 색을 흐리게 죽이지 않는다.
 */
export function PrimaryButton({
  variant = "primary",
  fullWidth = true,
  className,
  type = "button",
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-[48px] items-center justify-center gap-1.5 rounded-button",
        "px-5 text-[15px] font-bold transition-colors",
        "disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-text/70",
        fullWidth && "w-full",
        variant === "primary" && "bg-accent text-text hover:bg-active",
        variant === "secondary" &&
          "border border-primary bg-surface text-primary hover:bg-accent-soft",
        variant === "ghost" && "bg-transparent text-text-sub hover:bg-accent-soft",
        className,
      )}
      {...props}
    />
  );
}
