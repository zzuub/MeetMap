import type { EventCardVariant, EventSummary, HomeFeed } from "@/entities/event";
import { DISTRICT_LABEL } from "@/shared/config";

/**
 * 홈 섹션의 순서·카드 형태·`전체보기 >` 목적지 (5.1 / 5.3).
 * 렌더링과 떼어 둔 것은 섹션을 넣고 빼는 규칙을 DOM 없이 테스트하기 위해서다.
 */

export type HomeSectionKey = "weeklyPopular" | "myAgeGroup" | "newlyAdded";
export type HomeSectionLayout = "carousel" | "list";

export interface HomeSection {
  key: HomeSectionKey;
  title: string;
  /** 섹션 조건이 프리셋으로 걸린 탐색 (5-8). 도착한 화면이 칩 줄로 되비춘다 (P1-5c) */
  moreHref: string;
  variant: EventCardVariant;
  layout: HomeSectionLayout;
  events: EventSummary[];
}

const SECTIONS = [
  {
    key: "weeklyPopular",
    title: "이번 주 인기 소개팅",
    moreHref: "/explore?view=list&sort=popular&when=THIS_WEEK",
    variant: "feature",
    layout: "carousel",
  },
  {
    key: "myAgeGroup",
    title: "내 나이대 소개팅",
    moreHref: "/explore?view=list&eligibleOnly=1",
    variant: "ratio",
    layout: "carousel",
  },
  {
    key: "newlyAdded",
    title: "새로 등록된 소개팅",
    moreHref: "/explore?view=list&sort=latest",
    variant: "compact",
    layout: "list",
  },
] as const satisfies readonly Omit<HomeSection, "events">[];

/**
 * 그릴 섹션을 순서대로 돌려준다.
 *
 * - **섹션 B 는 로그인·프로필이 전제다** — 빼면 `새로 등록된` 이 자연히 위로 올라온다 (5.3)
 * - 건수 0인 섹션은 그리지 않는다. 제목과 `전체보기 >` 만 남은 줄은 빈 상태가 아니라 결함으로 보인다
 */
export function homeSections(
  feed: HomeFeed,
  { showMyAgeGroup }: { showMyAgeGroup: boolean },
): HomeSection[] {
  return SECTIONS.filter((section) => section.key !== "myAgeGroup" || showMyAgeGroup)
    .map((section) => ({ ...section, events: feed[section.key] }))
    .filter((section) => section.events.length > 0);
}

/* ── 지역 바로가기 (5-7) ────────────────────────────────── */

/** 목업은 4개 지역이 한 칩에 묶여 있었다. 개별 칩으로 나누되 개수는 유지한다 (5-7) */
const SHORTCUT_MAX = 4;

export interface DistrictShortcut {
  code: string;
  label: string;
  href: string;
}

/**
 * 지도 프로모 카드의 지역 바로가기 칩.
 *
 * 구 목록을 상수로 박지 않고 **화면에 실제로 뜬 소개팅의 구**에서 뽑는다 — 25개
 * 중 넷을 미리 고르면 결과 0건인 바로가기가 생긴다 (6.2 / 6.3 과 같은 원칙).
 */
export function districtShortcuts(sections: readonly HomeSection[]): DistrictShortcut[] {
  const found = new Map<string, DistrictShortcut>();

  for (const section of sections) {
    for (const event of section.events) {
      if (found.size >= SHORTCUT_MAX) return [...found.values()];

      // 같은 구가 두 번 오면 Map 이 접는다. 먼저 들어온 순서가 유지된다
      found.set(event.district, {
        code: event.district,
        label: DISTRICT_LABEL[event.district],
        // 프로모 카드가 지도로 보내므로 칩도 지도로 보낸다 (5-6 과 같은 뷰)
        href: `/explore?view=map&district=${event.district}`,
      });
    }
  }

  return [...found.values()];
}
