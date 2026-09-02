import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import type { EventSummary } from "../../model/types";
import { EventStatusBadge } from "../EventStatusBadge";
import { EventThumbnail } from "../EventThumbnail";
import { TimeSlotBadge } from "../TimeSlotBadge";
import { CARD_SHELL, CardPrice, CardTitle } from "./parts";
import type { EventCardLayoutProps } from "./types";

/**
 * `feature` — 홈 가로 스크롤 섹션. 196px 폭 / 썸네일 118px (5.3 섹션 A).
 * 표시 항목: 썸네일 + 찜, 상태·시간대 배지, 제목 2줄, 일시, 가격.
 */
export function FeatureCard({ event, viewer, action, href, className }: EventCardLayoutProps) {
  return (
    <VerticalCardFrame
      event={event}
      action={action}
      className={className}
      badges={
        <>
          <EventStatusBadge status={event.status} />
          <TimeSlotBadge slot={event.timeSlot} />
        </>
      }
      href={href}
      price={<CardPrice event={event} viewer={viewer} className="text-[13px]" />}
    />
  );
}

/**
 * `feature` 와 `ratio` 의 공통 뼈대.
 *
 * 둘은 크기·썸네일·제목·일시가 같고 **배지 줄과 정원 표기만 다르다**. 껍데기를
 * 나눠 두면 변형이 하나 더 늘어도 이 파일은 그대로다.
 */
export function VerticalCardFrame({
  event,
  action,
  badges,
  href,
  belowDate,
  price,
  className,
}: {
  event: EventSummary;
  action?: ReactNode;
  badges: ReactNode;
  href: string;
  /** `ratio` 의 정원 줄. `feature` 는 비운다 */
  belowDate?: ReactNode;
  price: ReactNode;
  className?: string;
}) {
  return (
    <article className={cn(CARD_SHELL, "w-[196px] shrink-0 overflow-hidden", className)}>
      <div className="relative">
        <EventThumbnail
          src={event.thumbnailUrl}
          label={event.provider.name}
          sizes="196px"
          className="h-[118px] w-full"
        />
        {action ? <div className="absolute top-1 right-1 z-10">{action}</div> : null}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <div className="flex flex-wrap gap-1">{badges}</div>

        <h3 className="line-clamp-2 text-[14px] leading-snug font-bold text-text">
          <CardTitle href={href}>{event.title}</CardTitle>
        </h3>

        <p className="text-[12px] text-text-sub">
          {event.dateLabel} {event.timeLabel}
        </p>

        {belowDate}
        {price}
      </div>
    </article>
  );
}
