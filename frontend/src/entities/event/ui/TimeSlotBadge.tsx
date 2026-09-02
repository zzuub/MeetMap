import { cn } from "@/shared/lib";
import { timeSlotLabel } from "../model/labels";
import type { TimeSlot } from "../model/types";
import { BADGE_BASE } from "./badgeBase";

interface TimeSlotBadgeProps {
  slot: TimeSlot;
  className?: string;
}

/**
 * 시간대 배지 4종 — `오전 / 오후 / 디너 / 심야` (6.2).
 *
 * 삭제한 카테고리 축을 대신하는 축이다. 낮 소개팅과 심야 소개팅은 복장·주류·
 * 기대치가 다르고, 시각은 모든 주최사 게시물에서 결측 없이 얻을 수 있다.
 */
export function TimeSlotBadge({ slot, className }: TimeSlotBadgeProps) {
  return (
    <span className={cn(BADGE_BASE, "bg-accent-soft text-text-sub", className)}>
      {timeSlotLabel(slot)}
    </span>
  );
}
