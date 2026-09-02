import { cn } from "@/shared/lib";
import { birthYearRangeLabel, providerScheduleLabel } from "../../model/labels";
import { CapacityText } from "../CapacityText";
import { EventStatusBadge } from "../EventStatusBadge";
import { EventThumbnail } from "../EventThumbnail";
import { TimeSlotBadge } from "../TimeSlotBadge";
import { CARD_SHELL, CardPrice, CardTitle } from "./parts";
import type { EventCardLayoutProps } from "./types";

/**
 * `list` — 탐색 리스트 · 검색 결과. 썸네일 92px 가로형 (6.5).
 * 표시 항목: 상태·시간대 배지, 제목, `주최사 · 날짜 시각 · N~N년생`, 정원, 가격, 찜.
 */
export function ListCard({ event, viewer, action, href, className }: EventCardLayoutProps) {
  return (
    <article className={cn(CARD_SHELL, "flex gap-3 p-3", className)}>
      <EventThumbnail
        src={event.thumbnailUrl}
        label={event.provider.name}
        sizes="92px"
        className="size-[92px] rounded-[14px]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap gap-1">
          <EventStatusBadge status={event.status} />
          <TimeSlotBadge slot={event.timeSlot} />
        </div>

        <h3 className="line-clamp-2 text-[14px] leading-snug font-bold text-text">
          <CardTitle href={href}>{event.title}</CardTitle>
        </h3>

        <p className="truncate text-[11px] text-text-sub">
          {providerScheduleLabel(event)} ·{" "}
          {birthYearRangeLabel(event.birthYearFrom, event.birthYearTo)}
        </p>

        {/* 찜 버튼은 6.5 대로 우하단. 가격과 같은 줄에 두어 서로 겹치지 않게 한다 */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <CapacityText
            maleCapacity={event.maleCapacity}
            femaleCapacity={event.femaleCapacity}
            className="text-[12px] text-text-sub"
          />
          <div className="z-10 flex items-center gap-1">
            <CardPrice event={event} viewer={viewer} className="text-[13px]" />
            {action}
          </div>
        </div>
      </div>
    </article>
  );
}
