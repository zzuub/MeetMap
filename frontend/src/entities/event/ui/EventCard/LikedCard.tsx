import { cn, formatDistance } from "@/shared/lib";
import { EventStatusBadge } from "../EventStatusBadge";
import { EventThumbnail } from "../EventThumbnail";
import { CARD_SHELL, CardPrice, CardTitle } from "./parts";
import type { EventCardLayoutProps } from "./types";

/**
 * `liked` — 찜 목록 (9장). 썸네일 66px 가로형.
 * 표시 항목: 상태 배지, 제목(1줄), `날짜 · 가격 · 거리`, 찜 해제 버튼.
 *
 * `compact` 에 조건을 붙이지 않고 따로 뒀다 — 공용 카드에 배지를 달면 홈에서 늘
 * `신청 가능` 만 찍힌다. 거리는 모르면 뺀다(`detailMetaLabel` 과 같다) (`decisions.md` 4.63).
 */
export function LikedCard({ event, viewer, action, href, className }: EventCardLayoutProps) {
  return (
    <article className={cn(CARD_SHELL, "flex items-center gap-3 p-3", className)}>
      <EventThumbnail
        src={event.thumbnailUrl}
        label={event.provider.name}
        sizes="66px"
        className="size-[66px] rounded-[12px]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap gap-1">
          <EventStatusBadge status={event.status} />
        </div>

        <h3 className="line-clamp-1 text-[14px] font-bold text-text">
          <CardTitle href={href}>{event.title}</CardTitle>
        </h3>

        <p className="truncate text-[12px] text-text-sub">
          {event.dateLabel} · <CardPrice event={event} viewer={viewer} />
          {event.distanceKm === null ? null : ` · ${formatDistance(event.distanceKm)}`}
        </p>
      </div>

      {action ? <div className="z-10 shrink-0">{action}</div> : null}
    </article>
  );
}
