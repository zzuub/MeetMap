import type { ComponentType } from "react";
import { CompactCard } from "./CompactCard";
import { FeatureCard } from "./FeatureCard";
import { ListCard } from "./ListCard";
import { RatioCard } from "./RatioCard";
import { SheetCard } from "./SheetCard";
import type {
  EventCardLayoutProps,
  EventCardProps,
  EventCardVariant,
} from "./types";

/**
 * 변형 → 레이아웃. **변형을 추가하는 일이 파일 하나 + 이 표 한 줄**이 되도록 둔다.
 * 한 함수에서 분기하면 6번째 변형이 올 때마다 기존 코드를 연다.
 */
const LAYOUTS: Record<EventCardVariant, ComponentType<EventCardLayoutProps>> = {
  feature: FeatureCard,
  ratio: RatioCard,
  compact: CompactCard,
  list: ListCard,
  sheet: SheetCard,
};

/**
 * 소개팅 카드 (14.1).
 *
 * 크기·표시 항목은 변형마다 다르고 각 레이아웃 파일이 갖는다. 여기서는 **어느
 * 변형에나 같은 것** 두 가지만 정한다 — 기본 링크 대상과 게스트 판정.
 *
 * 평점은 어느 변형에도 넣지 않는다. 회차 평점은 성립하지 않는 값이고 평점은
 * 주최사에 쌓인다 (`decisions.md` 4.19).
 */
export function EventCard({
  event,
  variant = "list",
  viewer = null,
  action,
  href,
  eligibleOnly,
  className,
}: EventCardProps) {
  const Layout = LAYOUTS[variant];

  return (
    <Layout
      event={event}
      viewer={viewer}
      action={action}
      href={href ?? `/events/${event.id}`}
      eligibleOnly={eligibleOnly}
      className={className}
    />
  );
}

export type {
  EventCardLayoutProps,
  EventCardProps,
  EventCardVariant,
  EventCardViewer,
} from "./types";
