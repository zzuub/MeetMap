import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface NumericProps {
  children: ReactNode;
  className?: string;
}

/**
 * 숫자 전용 세리프 표기 (2.2).
 *
 * **가격·평점·카운터 숫자는 Georgia 세리프로 쓴다**는 것이 이 디자인의 규칙이다.
 * 화면마다 `font-['Georgia']` 를 흩뿌리지 않도록 이 컴포넌트로만 통과시킨다.
 *
 * 본문 안에 섞이는 숫자(예: "총 12개 소개팅"의 12)에도 쓴다.
 */
export function Numeric({ children, className }: NumericProps) {
  return (
    <span className={cn("font-numeric tabular-nums", className)}>{children}</span>
  );
}
