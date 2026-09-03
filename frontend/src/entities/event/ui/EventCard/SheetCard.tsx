import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import {
  locationLabel,
  providerScheduleLabel,
  scaleLabel,
} from "../../model/labels";
import { BirthYearRangeText } from "../BirthYearRangeText";
import { CapacityText } from "../CapacityText";
import { EventStatusBadge } from "../EventStatusBadge";
import { EventThumbnail } from "../EventThumbnail";
import { CARD_SHELL, CardPrice, CardTitle } from "./parts";
import type { EventCardLayoutProps } from "./types";

/**
 * `sheet` — 지도 마커 시트. 썸네일 88px (6.6).
 * 헤더 + 태그 3종(`N~N년생` / `남 N · 여 N` / 규모) + 하단 가격·액션.
 */
export function SheetCard({ event, viewer, action, href, className }: EventCardLayoutProps) {
  return (
    <article className={cn(CARD_SHELL, "p-3", className)}>
      <div className="flex gap-3">
        <EventThumbnail
          src={event.thumbnailUrl}
          label={event.provider.name}
          sizes="88px"
          className="size-[88px] rounded-[14px]"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap gap-1">
            <EventStatusBadge status={event.status} />
          </div>

          <h3 className="line-clamp-2 text-[15px] leading-snug font-bold text-text">
            <CardTitle href={href}>{event.title}</CardTitle>
          </h3>

          <p className="truncate text-[12px] text-text-sub">
            {providerScheduleLabel(event)}
          </p>

          {/* 정밀도 표기. EXACT 가 아닌 건을 정확한 주소처럼 보이게 하면 헛걸음한다 (6.6) */}
          <p className="truncate text-[12px] text-text-sub">{locationLabel(event)}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <SheetTag>
          <BirthYearRangeText
            birthYearFrom={event.birthYearFrom}
            birthYearTo={event.birthYearTo}
          />
        </SheetTag>
        <SheetTag>
          <CapacityText
            maleCapacity={event.maleCapacity}
            femaleCapacity={event.femaleCapacity}
          />
        </SheetTag>
        <SheetTag>{scaleLabel(event.scale)}</SheetTag>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <CardPrice event={event} viewer={viewer} className="text-[16px]" />
        {action ? <div className="z-10">{action}</div> : null}
      </div>
    </article>
  );
}

/**
 * `shared/ui/TagChip` 으로 올리지 않았다 — 14장 인벤토리에 이름은 있지만 두 번째
 * 사용처(상세 7.1 정보 카드)가 아직 없다. 상세를 만들 때(P1-7) 같이 올린다.
 */
function SheetTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-chip bg-accent-soft px-2.5 py-1 text-[12px] text-text-sub">
      {children}
    </span>
  );
}
