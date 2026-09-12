import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseExploreParams } from "@/features/event-filter";
import { MapPromoCard } from "./MapPromoCard";

/**
 * **카드가 약속한 것과 도착한 지도가 같아야 한다** (5-6 · `decisions.md` 4.56 · 4.71).
 *
 * P3-1 로 지도가 실제가 됐지만 중심은 사용자 위치가 아니라 결과 범위이고 반경 축도 없다.
 * 그래서 5-6 원문의 `내 주변 3km` 와 `가까운` 을 쓰지 않는다.
 *
 * ⚠️ **한 방향만 건다.** 4.56 의 `MAP_AXIS_PHRASES` 는 `SORT_OPTIONS` 의 거리순이라는 코드 축이
 * 있어 양방향으로 걸었지만, 이 문구를 참으로 만드는 것은 **위치로 중심을 잡는 지도**이고 그걸
 * 가리키는 코드가 아직 없다. 그 지도를 만드는 판이 이 테스트를 뒤집는다 (`phase3-notes.md`).
 */
const PROXIMITY_PHRASES = ["내 주변", "3km", "가까운"];

describe("지도 프로모 카드 (5-6)", () => {
  const html = renderToStaticMarkup(
    <MapPromoCard
      shortcuts={[{ code: "MAPO", label: "마포구", href: "/explore" }]}
    />,
  );

  it("가깝다 · 반경을 약속하지 않는다 — 지도의 중심은 결과 범위다", () => {
    for (const phrase of PROXIMITY_PHRASES) {
      expect(html, `'${phrase}' 는 지도가 지키지 못하는 약속이다`).not.toContain(phrase);
    }
  });

  it("카드는 지도 뷰로 간다 — 주소는 exploreHref 가 만든다", () => {
    const href = /href="([^"]+)"/.exec(html)?.[1] ?? "";
    const search = new URL(href, "http://localhost").searchParams;

    expect(parseExploreParams(Object.fromEntries(search), { hasViewer: false }).view).toBe("map");
  });
});
