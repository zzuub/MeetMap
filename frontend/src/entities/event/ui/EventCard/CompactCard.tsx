import { cn } from "@/shared/lib";
import { providerSlotLabel } from "../../model/labels";
import { EventThumbnail } from "../EventThumbnail";
import { CARD_SHELL, CardPrice, CardTitle } from "./parts";
import type { EventCardLayoutProps } from "./types";

/**
 * `compact` — 홈 `새로 등록된 소개팅` · 찜 목록. 썸네일 64px 가로형 (5.3 섹션 C).
 * 표시 항목: 썸네일, 제목, `주최사 · 시간대 시각`, 가격.
 */
export function CompactCard({ event, viewer, action, href, className }: EventCardLayoutProps) {
  return (
    <article className={cn(CARD_SHELL, "flex items-center gap-3 p-2.5", className)}>
      <EventThumbnail
        src={event.thumbnailUrl}
        label={event.provider.name}
        sizes="64px"
        className="size-16 rounded-[12px]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-1 text-[13px] font-bold text-text">
          <CardTitle href={href}>{event.title}</CardTitle>
        </h3>
        <p className="truncate text-[11px] text-text-sub">{providerSlotLabel(event)}</p>
      </div>

      <div className="z-10 flex shrink-0 flex-col items-end gap-1">
        <CardPrice event={event} viewer={viewer} className="text-[12px]" />
        {action}
      </div>
    </article>
  );
}
