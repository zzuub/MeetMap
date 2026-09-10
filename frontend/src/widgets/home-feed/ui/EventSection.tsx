import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { EventCard, type EventCardViewer } from "@/entities/event";
import { LikeButton } from "@/features/event-like";
import type { HomeSection, HomeSectionLayout } from "../model/sections";

interface EventSectionProps {
  section: HomeSection;
  viewer: EventCardViewer | null;
}

/**
 * 홈 섹션 하나 — 제목 + `전체보기 >` + 카드 목록 (5.1 / 5-8).
 *
 * 배치는 두 가지뿐이고 앞으로도 늘 이유가 없지만, 카드 변형과 같은 방식으로
 * **표 + 컴포넌트**로 나눈다. `if (layout === …)` 을 쓰지 않는다 (src/README.md).
 */
const LAYOUTS: Record<HomeSectionLayout, ComponentType<CardListProps>> = {
  carousel: EventCarousel,
  list: EventList,
};

export function EventSection({ section, viewer }: EventSectionProps) {
  const List = LAYOUTS[section.layout];

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-center justify-between gap-2">
        <h2 className="text-[16px] font-bold text-text">{section.title}</h2>

        <Link
          href={section.moreHref}
          className="flex items-center gap-0.5 py-1 text-[13px] font-medium text-text-sub"
        >
          전체보기
          <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </header>

      <List label={section.title}>
        {section.events.map((event) => (
          <li key={event.id} className={section.layout === "carousel" ? "shrink-0" : undefined}>
            <EventCard
              event={event}
              variant={section.variant}
              viewer={viewer}
              action={<LikeButton eventId={event.id} />}
            />
          </li>
        ))}
      </List>
    </section>
  );
}

interface CardListProps {
  /** 목록의 접근성 이름. 섹션 제목을 그대로 쓴다 */
  label: string;
  children: ReactNode;
}

/**
 * 가로 스크롤 캐러셀 (5-10).
 *
 * **가로 스크롤이 허용된 유일한 자리**다 — 칩·필터는 `flex-wrap` 으로 만든다 (6.2).
 * `tabIndex` 는 장식이 아니다: 스크롤 컨테이너가 포커스를 못 받으면 키보드만 쓰는
 * 사용자가 방향키로 옆 카드를 볼 수 없다.
 */
function EventCarousel({ label, children }: CardListProps) {
  return (
    <ul
      tabIndex={0}
      aria-label={label}
      className="scrollbar-none -mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-1"
    >
      {children}
    </ul>
  );
}

/** 세로 리스트 — 섹션 C (5.1) */
function EventList({ label, children }: CardListProps) {
  return (
    <ul aria-label={label} className="flex flex-col gap-2">
      {children}
    </ul>
  );
}
