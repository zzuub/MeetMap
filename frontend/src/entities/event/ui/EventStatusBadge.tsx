import { cn } from "@/shared/lib";
import type { EventStatus } from "../model/types";
import { BADGE_BASE } from "./badgeBase";

interface EventStatusBadgeProps {
  status: EventStatus;
  className?: string;
}

/**
 * 모집 상태 배지 2종 (6.5 / 7.1).
 *
 * `신청 가능` / `마감` 뿐이다. 선착순이 아니라 주최사가 지원자를 심사해 선발하므로
 * `마감임박`·`잔여 N석` 이라는 값이 존재하지 않는다 (2026-09-01 도메인 재정의).
 *
 * 색만으로 구분하지 않도록 라벨을 그대로 노출한다 (15장). `--color-success` 위에는
 * 흰 텍스트를 올려도 되지만 `--color-accent` 위에는 안 된다 (2.2).
 */
export function EventStatusBadge({ status, className }: EventStatusBadgeProps) {
  const closed = status === "마감";

  return (
    <span
      className={cn(
        BADGE_BASE,
        closed ? "bg-disabled-bg text-text" : "bg-success text-surface",
        className,
      )}
    >
      {status}
    </span>
  );
}
