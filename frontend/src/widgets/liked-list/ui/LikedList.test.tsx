import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { EventSummary } from "@/entities/event";
import { LikeProvider } from "@/features/event-like";
import { ToastProvider } from "@/shared/ui";
import { LikedList } from "./LikedList";

/** 찜 버튼이 게스트를 로그인으로 보낼 때 쓰는 훅만 세운다 — `LikeButton.test.tsx` 와 같다 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

/**
 * 찜 목록이 **무엇을 그리는가** (9장 · `decisions.md` 4.64).
 *
 * jsdom 없이 본다 (4.10). 핵심은 셋째 블록이다 — `LikeProvider` 의 기준값에서 id 를
 * 빼 두는 것이 **해제를 누른 직후의 낙관 상태**와 같은 입력이다. 목록이 서버 prop 을
 * 그대로 그리도록 되돌리면 거기서 깨진다.
 *
 * 문구는 **리터럴로** 단언한다. 상수끼리 비교하면 무엇을 바꿔도 통과한다 (4.52).
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

const rooftop = summary("a", "루프탑 소개팅");
const lounge = summary("b", "라운지 소개팅");

function markup(liked: string[], events: EventSummary[]) {
  return renderToStaticMarkup(
    <ToastProvider>
      <LikeProvider liked={liked} toggleLike={async () => ({ ok: true }) as const}>
        <LikedList events={events} viewer={null} />
      </LikeProvider>
    </ToastProvider>,
  );
}

describe("찜 목록 — 빈 상태 (9장 · 11.2)", () => {
  it("문구와 함께 탐색으로 가는 길을 준다", () => {
    const html = markup([], []);

    expect(html).toContain("아직 찜한 소개팅이 없어요");
    expect(html).toContain("마음에 드는 소개팅의 하트를 누르면 여기에 저장돼요");
    expect(html).toContain('href="/explore"');
    expect(html).toContain("소개팅 탐색하러 가기");
  });

  it("없는 버튼 모양을 말하지 않는다 — 찜 버튼은 하트다", () => {
    expect(markup([], [])).not.toContain("동그라미");
  });

  it("개수 줄을 그리지 않는다 — `0개` 는 빈 상태가 대신한다", () => {
    expect(markup([], [])).not.toMatch(/찜한 소개팅 <span/);
  });
});

describe("찜 목록 — 카드", () => {
  it("개수를 세리프 숫자로 쓴다 (2.2)", () => {
    expect(markup(["a", "b"], [rooftop, lounge])).toMatch(
      /찜한 소개팅 <span class="[^"]*font-numeric[^"]*">2<\/span>개/,
    );
  });

  it("받은 순서대로 그린다 — 정렬은 서버가 한 번 한다", () => {
    const html = markup(["a", "b"], [lounge, rooftop]);

    expect(html.indexOf("라운지 소개팅")).toBeLessThan(html.indexOf("루프탑 소개팅"));
  });

  it("카드는 상세로 가고, 버튼은 찜한 상태로 그려진다 (9장 카드 클릭 · 찜 해제)", () => {
    const html = markup(["a"], [rooftop]);

    expect(html).toContain('href="/events/a"');
    expect(html).toContain('aria-label="찜 해제"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).not.toContain('aria-pressed="false"');
  });

  it("마감된 회차도 남고, 상태 배지가 그것을 말한다", () => {
    const closed = summary("c", "마감된 소개팅", { status: "마감" });
    const html = markup(["a", "c"], [rooftop, closed]);

    expect(html).toContain("마감된 소개팅");
    expect(html).toContain(">마감</span>");
    // 같은 값만 찍히는 배지가 아니다 (4.23 의 반대 조건)
    expect(html).toContain(">신청 가능</span>");
  });

  it("거리는 모르면 쓰지 않고, 알면 쓴다 — `-` 로 채우지 않는다", () => {
    expect(markup(["a"], [rooftop])).not.toContain("km");
    expect(markup(["a"], [rooftop])).not.toContain(" · -");

    const near = summary("n", "가까운 소개팅", { distanceKm: 1.2 });
    expect(markup(["n"], [near])).toContain(" · 1.2km");
  });
});

describe("찜 목록 — 낙관 상태로 거른다 (4.64)", () => {
  it("해제한 카드는 서버 응답을 기다리지 않고 사라진다", () => {
    // 서버는 아직 둘을 준다. 낙관 상태에서는 `b` 가 빠졌다
    const html = markup(["a"], [rooftop, lounge]);

    expect(html).toContain("루프탑 소개팅");
    expect(html).not.toContain("라운지 소개팅");
    expect(html).toMatch(/찜한 소개팅 <span[^>]*>1<\/span>개/);
  });

  it("마지막 한 장을 해제하면 그 자리에서 빈 상태가 된다", () => {
    expect(markup([], [rooftop])).toContain("아직 찜한 소개팅이 없어요");
  });

  it("찜 id 가 있어도 회차가 오지 않으면 세지 않는다 — 삭제된 회차", () => {
    expect(markup(["a", "ghost"], [rooftop])).toMatch(/찜한 소개팅 <span[^>]*>1<\/span>개/);
  });
});
