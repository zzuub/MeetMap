import { cn } from "../lib/cn";

interface SkeletonProps {
  className?: string;
}

/**
 * 로딩 스켈레톤 (11.3).
 *
 * 목업에 정의되어 있지 않아 신규 설계한 요소다. 카드 형태별 스켈레톤은
 * 각 entity/widget 에서 이 박스를 조합해 만든다.
 */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-card bg-border/60", className)}
    />
  );
}
