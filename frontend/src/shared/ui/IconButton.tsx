import type { ButtonHTMLAttributes } from "react";
import { cn } from "../lib/cn";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** 아이콘만 있으므로 필수다. 없으면 스크린리더가 읽을 게 없다. */
  label: string;
  /**
   * 히트 영역. `default` 44px · `cta` 48px (7.2 하단 고정 CTA 의 찜 원형).
   *
   * ⚠️ **`className` 으로 크기를 덮어쓰지 않는다.** `cn` 은 문자열을 이어붙이기만
   * 하므로 `size-11` 과 `size-12` 가 함께 남아 조용히 싸운다. 그래서 크기를 밖에서
   * 주는 대신 **여기서 고른다** — 44px 하한이 이 컴포넌트 한 곳에 남는다 (15장).
   */
  size?: "default" | "cta";
}

const SIZES: Record<NonNullable<IconButtonProps["size"]>, string> = {
  default: "size-11",
  cta: "size-12",
};

/**
 * 아이콘 전용 버튼 (헤더 액션, 찜 버튼 등).
 *
 * **터치 타깃 최소 44×44px** (15장). 목업의 찜 버튼은 26~30px이라 그대로 옮기면
 * 접근성 기준 미달이다. 시각적 원은 작게 두되 히트 영역은 이 컴포넌트가 확보한다.
 */
export function IconButton({
  label,
  size = "default",
  className,
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-chip",
        SIZES[size],
        "text-primary transition-colors hover:bg-accent-soft",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
