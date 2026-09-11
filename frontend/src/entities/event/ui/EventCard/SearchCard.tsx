import { Fragment } from "react";
import { cn, highlightKeyword } from "@/shared/lib";
import { searchMetaLabel } from "../../model/labels";
import { EventStatusBadge } from "../EventStatusBadge";
import { EventThumbnail } from "../EventThumbnail";
import { TimeSlotBadge } from "../TimeSlotBadge";
import { CARD_SHELL, CardPrice, CardTitle } from "./parts";
import type { EventCardLayoutProps } from "./types";

/**
 * `search` — 검색 결과 (11.1). 썸네일 84px 가로형.
 * 표시 항목: 상태·시간대 배지, **검색어를 칠한 제목**, `주최사 · 일시 · 지역`, 가격, 찜.
 *
 * `list` 를 쓰지 않은 이유는 `지역` 이다 — 지역으로만 걸린 결과가 카드에서 이유를
 * 못 대면 엉뚱한 결과로 읽힌다 (`decisions.md` 4.67).
 */
export function SearchCard({
  event,
  viewer,
  action,
  href,
  keyword = "",
  className,
}: EventCardLayoutProps) {
  return (
    <article className={cn(CARD_SHELL, "flex gap-3 p-3", className)}>
      <EventThumbnail
        src={event.thumbnailUrl}
        label={event.provider.name}
        sizes="84px"
        className="size-[84px] rounded-[14px]"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap gap-1">
          <EventStatusBadge status={event.status} />
          <TimeSlotBadge slot={event.timeSlot} />
        </div>

        <h3 className="line-clamp-2 text-[14px] leading-snug font-bold text-text">
          <CardTitle href={href}>
            <Highlighted text={event.title} keyword={keyword} />
          </CardTitle>
        </h3>

        <p className="truncate text-[11px] text-text-sub">{searchMetaLabel(event)}</p>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <CardPrice event={event} viewer={viewer} className="text-[13px]" />
          {action ? <div className="z-10 shrink-0">{action}</div> : null}
        </div>
      </div>
    </article>
  );
}

/**
 * 검색어를 `<mark>` 로 칠한다. **HTML 문자열을 만들지 않는다** — 소개팅명은 주최사가
 * 넣는 외부 입력이라 `dangerouslySetInnerHTML` 은 XSS 경로다 (`highlightKeyword`).
 */
function Highlighted({ text, keyword }: { text: string; keyword: string }) {
  return (
    <>
      {highlightKeyword(text, keyword).map((part, index) =>
        part.matched ? (
          <mark key={index} className="rounded-[4px] bg-accent-soft px-0.5 text-inherit">
            {part.text}
          </mark>
        ) : (
          <Fragment key={index}>{part.text}</Fragment>
        ),
      )}
    </>
  );
}
