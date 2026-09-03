import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import { isEligible } from "../../model/derive";
import { birthYearLabel, birthYearRangeLabel } from "../../model/labels";
import type { EventSummary } from "../../model/types";
import { BADGE_BASE } from "../badgeBase";
import { PriceText } from "../PriceText";
import type { EventCardViewer } from "./types";

/**
 * 레이아웃 5종이 공유하는 조각.
 *
 * 크기·배치는 각 레이아웃이 정하고, 여기 있는 것은 **어느 변형에서나 같아야 하는
 * 규칙**뿐이다 — 링크 히트 영역, 가격 기준, 자격 배지 문구.
 */

/**
 * 카드 껍데기. `relative` 는 필수다 — `CardTitle` 의 `::after` 가 이 요소를 기준으로
 * 늘어난다. 다른 조상에 `relative` 를 두면 히트 영역이 그쪽으로 잘린다.
 */
export const CARD_SHELL = "relative rounded-card border border-border bg-surface";

/**
 * 카드 전체로 늘어나는 제목 링크 (stretched link).
 *
 * `<a><button/></a>` 중첩과 `div + onClick` 을 둘 다 피한다. 액션 버튼은 `z-10` 으로
 * 이 위에 올라가므로 클릭이 겹치지 않는다 → `progress.md` 4.16
 */
export function CardTitle({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="after:absolute after:inset-0 after:content-['']">
      {children}
    </Link>
  );
}

/** 사용자 성별 기준 참가비. 게스트는 병기, 미확인은 `링크 확인` (2.2) */
export function CardPrice({
  event,
  viewer,
  className,
}: {
  event: EventSummary;
  viewer: EventCardViewer | null;
  className?: string;
}) {
  return (
    <span className={className}>
      <PriceText
        malePrice={event.malePrice}
        femalePrice={event.femalePrice}
        gender={viewer?.gender ?? null}
        className="font-bold text-text"
      />
    </span>
  );
}

/**
 * `ratio` 변형의 자격 배지 (5.3 섹션 B).
 *
 * 자격이 있으면 `96년생 참가 가능`, 아니면 모집 범위로 떨어진다. 게스트에게는
 * 섹션 자체가 숨겨지지만 다른 자리에 쓰일 때를 위해 폴백을 둔다.
 */
export function EligibilityBadge({
  event,
  viewer,
}: {
  event: EventSummary;
  viewer: EventCardViewer | null;
}) {
  const label =
    viewer !== null && isEligible(event, viewer)
      ? birthYearLabel(viewer.birthYear)
      : birthYearRangeLabel(event.birthYearFrom, event.birthYearTo);

  return <span className={cn(BADGE_BASE, "bg-active text-text")}>{label} 참가 가능</span>;
}
