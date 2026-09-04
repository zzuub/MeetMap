import type { EventCardViewer, HomeFeed as HomeFeedData } from "@/entities/event";
import { districtShortcuts, homeSections } from "../model/sections";
import { EventSection } from "./EventSection";
import { HomeHero } from "./HomeHero";
import { MapPromoCard } from "./MapPromoCard";

interface HomeFeedProps {
  feed: HomeFeedData;
  /** 가격·자격의 기준 주체. 게스트는 `null` 이고 가격이 남·여 병기로 떨어진다 (2.2) */
  viewer: EventCardViewer | null;
  /** 섹션 B 노출 여부. 게스트·출생연도 미입력이면 숨긴다 (5.3) */
  showMyAgeGroup: boolean;
}

/**
 * 홈 피드 (5장).
 *
 * 헤드라인 → 지도 프로모 카드 → 섹션 3개. **퀵 필터 칩 바는 없다** — 필터는 탐색
 * 화면 한 곳뿐이고, 홈은 큐레이션이 역할이다 (5.4).
 */
export function HomeFeed({ feed, viewer, showMyAgeGroup }: HomeFeedProps) {
  const sections = homeSections(feed, { showMyAgeGroup });

  return (
    <div className="flex flex-col gap-7 px-5 py-4">
      <HomeHero baseAreaLabel={feed.baseAreaLabel} />
      <MapPromoCard shortcuts={districtShortcuts(sections)} />

      {sections.map((section) => (
        <EventSection key={section.key} section={section} viewer={viewer} />
      ))}
    </div>
  );
}
