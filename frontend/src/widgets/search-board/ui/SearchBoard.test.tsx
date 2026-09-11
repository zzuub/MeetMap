import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { EventSummary } from "@/entities/event";
import type { TrendingSnapshot } from "@/entities/search";
import { LikeProvider } from "@/features/event-like";
import { SearchProvider } from "@/features/event-search";
import { ToastProvider } from "@/shared/ui";
import { SearchEmpty } from "./SearchEmpty";
import { SearchIdle } from "./SearchIdle";
import { SearchResults } from "./SearchResults";
import { SearchStatus } from "./SearchStatus";

/** 찜 버튼·검색 입력이 쓰는 라우터 훅만 세운다 — `LikedList.test.tsx` 와 같은 방법 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: () => {}, replace: () => {}, back: () => {} }),
  useSearchParams: () => new URLSearchParams(),
}));

/**
 * 검색 본문이 **무엇을 그리는가** (11.1 · `decisions.md` 4.66 표 5·6·11번 · 4.67).
 * jsdom 없이 본다 (4.10). 문구는 리터럴로 단언한다 (4.52).
 */
function summary(id: string, title: string, overrides: Partial<EventSummary> = {}): EventSummary {
  return {
    id,
    title,
    shortTitle: title,
    provider: { id: "prv-t", name: "테스트주최" },
    // 이미지를 비워 `next/image` 를 거치지 않는다 — 이 테스트의 대상이 아니다
    thumbnailUrl: null,
    date: "2026-09-20T19:30:00+09:00",
    dateLabel: "9/20(일)",
    timeLabel: "19:30",
    timeSlot: "DINNER",
    birthYearFrom: 1990,
    birthYearTo: 1996,
    maleCapacity: 7,
    femaleCapacity: 7,
    scale: "STANDARD",
    malePrice: 45000,
    femalePrice: 35000,
    status: "신청 가능",
    jobGroups: [],
    mood: [],
    area: "성수·건대",
    province: "SEOUL",
    district: "SEONGDONG",
    locationPrecision: "EXACT",
    stationName: null,
    lat: 0,
    lng: 0,
    distanceKm: null,
    popularity: 0,
    createdAt: "2026-09-01T10:00:00+09:00",
    isLiked: false,
    ...overrides,
  };
}

function results(events: EventSummary[], keyword: string) {
  return renderToStaticMarkup(
    <ToastProvider>
      <LikeProvider liked={[]} toggleLike={async () => ({ ok: true }) as const}>
        <SearchResults events={events} keyword={keyword} viewer={null} />
      </LikeProvider>
    </ToastProvider>,
  );
}

function inSearchScreen(children: ReactNode) {
  return renderToStaticMarkup(<SearchProvider>{children}</SearchProvider>);
}

describe("결과 목록 — `search` 카드 (4.67)", () => {
  const rooftop = summary("a", "성수 루프탑 로테이션 소개팅");

  it("제목의 검색어를 `<mark>` 로 칠한다", () => {
    expect(results([rooftop], "로테이션")).toMatch(/성수 루프탑 <mark[^>]*>로테이션<\/mark> 소개팅/);
  });

  it("제목은 외부 입력이다 — 태그 글자가 태그로 그려지지 않는다", () => {
    const hostile = summary("x", "<img src=x onerror=alert(1)> 로테이션");
    const html = results([hostile], "로테이션");

    expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(html).not.toContain("<img");
  });

  it("메타 줄은 `주최사 · 일시 · 지역` 이다 — 지역으로 걸린 이유가 보인다", () => {
    expect(results([rooftop], "건대")).toContain("테스트주최 · 9/20(일) 19:30 · 성수·건대");
  });

  it("상태·시간대 배지와 찜을 그리고, 정원은 그리지 않는다 — `list` 가 아니다", () => {
    const html = results([rooftop], "성수");

    expect(html).toContain(">신청 가능</span>");
    expect(html).toContain(">디너</span>");
    expect(html).toContain('aria-label="찜하기"');
    expect(html).toContain("size-[84px]");
    expect(html).not.toContain("남 7 · 여 7");
  });

  it("상세로 가고, 받은 순서대로 그린다 — 정렬은 서버가 한 번 한다", () => {
    const later = summary("b", "라운지 소개팅");
    const html = results([later, rooftop], "소개팅");

    expect(html).toContain('href="/events/a"');
    expect(html.indexOf("라운지")).toBeLessThan(html.indexOf("루프탑"));
  });
});

describe("SearchStatus — 결과를 스크린리더에 알리는 자리", () => {
  it("모든 상태가 같은 요소다 — 그래야 바뀐 글자가 읽힌다", () => {
    for (const html of [
      renderToStaticMarkup(<SearchStatus state={{ kind: "idle" }} />),
      renderToStaticMarkup(<SearchStatus state={{ kind: "failed" }} />),
      renderToStaticMarkup(<SearchStatus state={{ kind: "empty", keyword: "와인바" }} />),
      renderToStaticMarkup(<SearchStatus state={{ kind: "results", count: 3 }} />),
    ]) {
      expect(html.startsWith('<p role="status"')).toBe(true);
    }
  });

  it("결과가 있으면 `검색 결과 N건` 을 보이게 쓴다(세리프)", () => {
    const html = renderToStaticMarkup(<SearchStatus state={{ kind: "results", count: 3 }} />);

    expect(html).toMatch(/검색 결과 <span class="[^"]*font-numeric[^"]*">3<\/span>건/);
    expect(html).not.toContain("sr-only");
  });

  it("0건은 가려진 채 제목을 읽힌다 — 보이는 제목은 빈 상태가 쓴다", () => {
    const html = renderToStaticMarkup(<SearchStatus state={{ kind: "empty", keyword: "와인바" }} />);

    expect(html).toContain("sr-only");
    expect(html).toContain("&#x27;와인바&#x27; 검색 결과가 없어요");
  });
});

describe("결과 없음 (11.1 · 11.2 · 4.68)", () => {
  it("제목·설명·추천 칩·다시 검색하기", () => {
    const html = inSearchScreen(<SearchEmpty keyword="와인바" suggestions={["성수", "강남"]} />);

    expect(html).toContain("&#x27;와인바&#x27; 검색 결과가 없어요");
    expect(html).toContain("철자가 맞는지 확인하거나 더 짧은 키워드로 검색해보세요");
    expect(html).toContain("이런 검색은 어때요?");
    expect(html).toContain(">성수</button>");
    expect(html).toContain("다시 검색하기");
  });

  it("추천이 없어도 다음 행동은 남는다 — `다시 검색하기`", () => {
    const html = inSearchScreen(<SearchEmpty keyword="와인바" suggestions={[]} />);

    expect(html).not.toContain("이런 검색은 어때요?");
    expect(html).toContain("다시 검색하기");
  });
});

describe("idle — 최근 검색어 + 인기 검색어", () => {
  const trending: TrendingSnapshot = {
    baseAt: "2026-09-11T01:00:00Z",
    keywords: [{ keyword: "성수", previousRank: null }],
  };

  it("서버 렌더에서는 최근 검색어를 모른다 — 없다고 말하지 않는다 (4.69)", () => {
    const html = inSearchScreen(<SearchIdle trending={trending} />);

    expect(html).toContain("최근 검색어");
    expect(html).not.toContain("최근 검색 기록이 없습니다");
  });

  it("인기 검색어를 못 받았으면 그 섹션만 빠진다", () => {
    expect(inSearchScreen(<SearchIdle trending={trending} />)).toContain("인기 검색어");

    const html = inSearchScreen(<SearchIdle trending={null} />);
    expect(html).not.toContain("인기 검색어");
    expect(html).toContain("최근 검색어");
  });
});
