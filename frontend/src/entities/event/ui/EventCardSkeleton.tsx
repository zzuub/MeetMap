import { cn } from "@/shared/lib";
import { Skeleton } from "@/shared/ui";
import { CARD_SHELL } from "./EventCard/parts";
import type { EventCardVariant } from "./EventCard/types";

/**
 * 카드 스켈레톤 (11.3).
 *
 * 목업에 없어 신규 설계한 요소다. **지키는 것은 하나 — 진짜 카드와 같은 높이**여야
 * 한다. 스켈레톤이 낮으면 응답이 온 순간 아래 내용이 밀려 올라가고, 그 사이 눌린
 * 손가락이 엉뚱한 카드를 연다.
 *
 * 표를 `Record<EventCardVariant, …>` 로 잡은 이유는 `EventCard` 의 `LAYOUTS` 와 같다 —
 * **변형이 하나 늘면 여기가 컴파일 에러**로 스켈레톤을 요구한다. 카드만 늘고
 * 스켈레톤이 안 따라오면 그 화면의 로딩만 조용히 모양이 어긋난다.
 */
interface CardShape {
  /** 세로형(홈 캐러셀)인가 가로 행인가 */
  frame: "vertical" | "row";
  /** 썸네일 크기. 진짜 카드의 `EventThumbnail` 과 같은 값이다 */
  thumb: string;
  /** 썸네일 옆(아래)에 쌓이는 텍스트 줄 수 */
  lines: number;
}

const SHAPES: Record<EventCardVariant, CardShape> = {
  feature: { frame: "vertical", thumb: "h-[118px] w-full", lines: 4 },
  // `ratio` 는 `feature` 와 같은 뼈대에 정원 줄이 하나 더 붙는다
  ratio: { frame: "vertical", thumb: "h-[118px] w-full", lines: 5 },
  compact: { frame: "row", thumb: "size-16", lines: 2 },
  list: { frame: "row", thumb: "size-[92px]", lines: 4 },
  sheet: { frame: "row", thumb: "size-[88px]", lines: 4 },
  liked: { frame: "row", thumb: "size-[66px]", lines: 3 },
  search: { frame: "row", thumb: "size-[84px]", lines: 4 },
};

/** 줄 너비를 돌아가며 준다 — 전부 같은 길이면 텍스트가 아니라 표로 보인다 */
const LINE_WIDTHS = ["w-full", "w-4/5", "w-3/5", "w-2/5", "w-1/2"] as const;

export function EventCardSkeleton({
  variant = "list",
  className,
}: {
  variant?: EventCardVariant;
  className?: string;
}) {
  const shape = SHAPES[variant];
  const lines = Array.from({ length: shape.lines }, (_, index) => index);

  if (shape.frame === "vertical") {
    return (
      <div
        aria-hidden
        className={cn(CARD_SHELL, "w-[196px] shrink-0 overflow-hidden", className)}
      >
        <Skeleton className={cn("rounded-none", shape.thumb)} />
        <div className="flex flex-col gap-1.5 p-3">
          {lines.map((index) => (
            <Skeleton
              key={index}
              className={cn("h-3.5 rounded-chip", LINE_WIDTHS[index % LINE_WIDTHS.length])}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden className={cn(CARD_SHELL, "flex gap-3 p-3", className)}>
      <Skeleton className={cn("shrink-0 rounded-[14px]", shape.thumb)} />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
        {lines.map((index) => (
          <Skeleton
            key={index}
            className={cn("h-3.5 rounded-chip", LINE_WIDTHS[index % LINE_WIDTHS.length])}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * 같은 변형을 `count` 장. 화면마다 `Array.from` 을 다시 쓰지 않게 둔다.
 *
 * `<li>` 로 감싸지 않는다 — 진짜 목록은 `ul > li` 인데 스켈레톤은 목록이 아니라
 * 자리 표시라, 보조기술에 항목 수를 세어 읽히면 안 된다 (`aria-hidden`).
 */
export function EventCardSkeletonList({
  variant = "list",
  count,
  className,
}: {
  variant?: EventCardVariant;
  count: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: count }, (_, index) => (
        <EventCardSkeleton key={index} variant={variant} />
      ))}
    </div>
  );
}
