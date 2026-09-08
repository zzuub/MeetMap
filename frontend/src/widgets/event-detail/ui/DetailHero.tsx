import {
  EventStatusBadge,
  EventThumbnail,
  TimeSlotBadge,
  detailMetaLabel,
  type EventDetail,
} from "@/entities/event";

/**
 * 히어로 + 배지 + 타이틀 + 메타 (7.1 상단 4행).
 *
 * **이미지가 없는 것은 정상 경로다** (7.2 · 4.18). 카드와 같은 `EventThumbnail` 을 써
 * 대체 표시가 목록과 같다. `images[0]` 을 먼저 보는 것은 목록용 썸네일을 220px 로
 * 늘리지 않기 위해서다.
 *
 * **모집 상태 배지가 여기에는 있다** — 홈과 달리(4.23) 마감된 회차에 직접 도달할 수
 * 있다. 공유 링크·뒤로가기가 그 경로다.
 */
export function DetailHero({ event }: { event: EventDetail }) {
  return (
    <header>
      <EventThumbnail
        src={event.images[0] ?? event.thumbnailUrl}
        label={event.provider.name}
        sizes="(max-width: 430px) 100vw, 430px"
        className="h-[220px] w-full"
      />

      <div className="flex flex-col gap-2 px-5 pt-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <EventStatusBadge status={event.status} />
          <TimeSlotBadge slot={event.timeSlot} />
        </div>

        <h1 className="text-[20px] leading-[1.35] font-bold text-text">
          {event.title}
        </h1>

        <p className="text-[13px] leading-5 text-text-sub">
          {detailMetaLabel(event)}
        </p>
      </div>
    </header>
  );
}
