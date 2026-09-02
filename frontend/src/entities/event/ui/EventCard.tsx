import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import { isEligible } from "../model/derive";
import {
  birthYearLabel,
  birthYearRangeLabel,
  locationLabel,
  providerScheduleLabel,
  providerSlotLabel,
  scaleLabel,
} from "../model/labels";
import type { EventSummary, ViewerGender } from "../model/types";
import { BADGE_BASE } from "./badgeBase";
import { BirthYearRangeText } from "./BirthYearRangeText";
import { CapacityText } from "./CapacityText";
import { EventStatusBadge } from "./EventStatusBadge";
import { EventThumbnail } from "./EventThumbnail";
import { PriceText } from "./PriceText";
import { TimeSlotBadge } from "./TimeSlotBadge";

/**
 * 카드 변형 5종 (14.1). 자리마다 크기와 표시 항목이 다르다.
 *
 * | variant | 자리 | 근거 |
 * | --- | --- | --- |
 * | `feature` | 홈 가로 스크롤 (196px) | 5.3 섹션 A |
 * | `ratio` | 홈 `내 나이대` (196px + 정원) | 5.3 섹션 B |
 * | `compact` | 홈 `새로 등록된`, 찜 목록 (썸네일 64px) | 5.3 섹션 C |
 * | `list` | 탐색 리스트, 검색 결과 (썸네일 92px) | 6.5 |
 * | `sheet` | 지도 마커 시트 (썸네일 88px) | 6.6 |
 *
 * `ratio` 라는 이름은 성비 게이지가 있던 시절의 잔재다(14.1 이 그 이름으로 부른다).
 * 지금 이 변형이 하는 일은 **정원 표기 + 자격 배지**이지 성비 표시가 아니다.
 */
export type EventCardVariant = "feature" | "ratio" | "compact" | "list" | "sheet";

/**
 * 가격·자격의 기준이 되는 주체. **게스트는 `null`** 이다.
 *
 * `entities/user` 를 import 하지 않는다(FSD 동일 레이어 금지). 카드가 필요한 건
 * 프로필 전체가 아니라 이 두 값뿐이므로 상위 레이어가 뽑아 넘긴다.
 */
export interface EventCardViewer {
  gender: ViewerGender;
  birthYear: number;
}

export interface EventCardProps {
  event: EventSummary;
  variant?: EventCardVariant;
  viewer?: EventCardViewer | null;
  /**
   * 찜·신청 버튼이 놓이는 자리. **`entities` 는 `features` 를 모르므로** 버튼 자체를
   * 여기서 만들지 않고 상위 레이어(`features/event-like`, `features/event-apply`)가
   * 채워 넣는다.
   *
   * 놓이는 위치는 variant 가 정한다 — `feature`/`ratio`: 썸네일 우상단,
   * `compact`: 우측 열, `list`: 우하단(6.5), `sheet`: 하단 가격 옆(6.6).
   */
  action?: ReactNode;
  /** 기본값 `/events/{id}`. 검색 결과처럼 쿼리를 붙여야 할 때만 넘긴다 */
  href?: string;
  className?: string;
}

/**
 * 소개팅 카드.
 *
 * **카드 전체가 링크이고 액션 버튼은 그 위에 뜬다.** 링크 안에 버튼을 중첩하면
 * (`<a><button/></a>`) HTML 이 무효고 스크린리더가 둘을 한 덩어리로 읽는다.
 * 그래서 제목의 링크를 `::after` 로 카드 전체에 늘리고(stretched link), 액션은
 * `z-10` 으로 그 위에 올린다. 클릭 이벤트가 겹치지 않으므로 6.5 가 요구하는
 * `stopPropagation` 이 애초에 필요 없다.
 *
 * 평점·후기 수는 **어느 변형에도 넣지 않는다.** 5.3·6.5 의 표시 항목에 없고,
 * 7.1 상세에도 없다. 후기는 비교함(8장)과 후기 목록(10.4)의 축이다.
 */
export function EventCard({
  event,
  variant = "list",
  viewer = null,
  action,
  href,
  className,
}: EventCardProps) {
  const to = href ?? `/events/${event.id}`;
  const gender = viewer?.gender ?? null;

  const price = (
    <PriceText
      malePrice={event.malePrice}
      femalePrice={event.femalePrice}
      gender={gender}
      className="font-bold text-text"
    />
  );

  const title = (
    <Link
      href={to}
      // 카드 전체로 늘어나는 히트 영역. 부모 <article> 이 유일한 positioned 조상이다.
      className="after:absolute after:inset-0 after:content-['']"
    >
      {event.title}
    </Link>
  );

  if (variant === "feature" || variant === "ratio") {
    const eligibleForViewer = viewer !== null && isEligible(event, viewer);

    return (
      <article className={cn(SHELL, "w-[196px] shrink-0 overflow-hidden", className)}>
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
          <div className="flex flex-wrap gap-1">
            {variant === "ratio" ? (
              // 5.3 섹션 B 는 `{N}년생 참가 가능` 이 배지다. 게스트에게는 섹션 자체가
              // 숨겨지지만(홈이 세션으로 판단), 그 밖의 자리에 쓰일 때를 위해
              // 모집 범위로 떨어뜨린다.
              <span className={cn(BADGE_BASE, "bg-active text-text")}>
                {eligibleForViewer
                  ? `${birthYearLabel(viewer.birthYear)} 참가 가능`
                  : `${birthYearRangeLabel(event.birthYearFrom, event.birthYearTo)} 참가 가능`}
              </span>
            ) : (
              <>
                <EventStatusBadge status={event.status} />
                <TimeSlotBadge slot={event.timeSlot} />
              </>
            )}
          </div>

          <h3 className="line-clamp-2 text-[14px] leading-snug font-bold text-text">
            {title}
          </h3>

          <p className="text-[12px] text-text-sub">
            {event.dateLabel} {event.timeLabel}
          </p>

          {variant === "ratio" ? (
            <CapacityText
              maleCapacity={event.maleCapacity}
              femaleCapacity={event.femaleCapacity}
              className="text-[12px] text-text-sub"
            />
          ) : null}

          <span className="text-[13px]">{price}</span>
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className={cn(SHELL, "flex items-center gap-3 p-2.5", className)}>
        <EventThumbnail
          src={event.thumbnailUrl}
          label={event.provider.name}
          sizes="64px"
          className="size-16 rounded-[12px]"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-1 text-[13px] font-bold text-text">{title}</h3>
          <p className="truncate text-[11px] text-text-sub">{providerSlotLabel(event)}</p>
        </div>

        <div className="z-10 flex shrink-0 flex-col items-end gap-1">
          <span className="text-[12px]">{price}</span>
          {action}
        </div>
      </article>
    );
  }

  if (variant === "list") {
    return (
      <article className={cn(SHELL, "flex gap-3 p-3", className)}>
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
            {title}
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
              <span className="text-[13px]">{price}</span>
              {action}
            </div>
          </div>
        </div>
      </article>
    );
  }

  // sheet — 지도 마커 시트 (6.6). 헤더 + 태그 3종 + 하단 가격·액션
  return (
    <article className={cn(SHELL, "p-3", className)}>
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
            {title}
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
        <span className="text-[16px]">{price}</span>
        {action ? <div className="z-10">{action}</div> : null}
      </div>
    </article>
  );
}

/**
 * 카드 껍데기.
 *
 * `relative` 는 필수다 — 제목 링크의 `::after` 가 이 요소를 기준으로 늘어난다.
 * 다른 조상에 `relative` 를 두면 히트 영역이 그쪽으로 잘린다.
 */
const SHELL = "relative rounded-card border border-border bg-surface";

/**
 * 마커 시트의 태그 3종 (6.6).
 *
 * `shared/ui/TagChip` 으로 올리지 않았다 — 14장 인벤토리에 이름은 있지만 두 번째
 * 사용처(상세 7.1 정보 카드)가 아직 없어서, 지금 올리면 한 곳만 쓰는 공통
 * 컴포넌트가 된다. 상세를 만들 때(P1-7) 같이 올린다.
 */
function SheetTag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-chip bg-accent-soft px-2.5 py-1 text-[12px] text-text-sub">
      {children}
    </span>
  );
}
