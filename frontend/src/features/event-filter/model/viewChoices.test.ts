import { describe, expect, it } from "vitest";
import { MOOD_TAGS, PRICE_CAPS } from "@/shared/config";
import {
  parseExploreParams,
  type ExploreParams,
  type ExploreView,
  type RawSearchParams,
} from "./exploreParams";
import { viewChoices } from "./viewChoices";

/**
 * 뷰 토글 `리스트 / 지도` (6.2 · `decisions.md` 4.29 → 4.71).
 *
 * 입력을 `parseExploreParams` 로 만든다 — 게스트에게 인증 축이 없는 실제 형태를 손으로
 * 흉내 내다 틀리면 게스트 케이스가 거짓으로 통과한다 (`sortChoices.test` 와 같은 이유).
 */
const asUser = (params: RawSearchParams) => parseExploreParams(params, { hasViewer: true });
const asGuest = (params: RawSearchParams) => parseExploreParams(params, { hasViewer: false });

/** 선택지의 주소를 다시 읽어 "뷰만 바뀌었는지" 본다 */
function afterPicking(params: ExploreParams, view: ExploreView): ExploreParams {
  const choice = viewChoices(params).find((item) => item.value === view);
  if (!choice) throw new Error("선택지가 없다: " + view);

  const search = choice.href.split("?")[1] ?? "";
  return parseExploreParams(Object.fromEntries(new URLSearchParams(search)), {
    hasViewer: params.query.eligibleOnly !== undefined,
  });
}

describe("보여주는 것", () => {
  it("리스트 · 지도 둘이고 이 순서다 (6.2)", () => {
    expect(viewChoices(asUser({})).map((choice) => choice.label)).toEqual(["리스트", "지도"]);
  });

  it("지금 뷰 하나만 selected 다", () => {
    const selected = (params: ExploreParams) =>
      viewChoices(params)
        .filter((choice) => choice.selected)
        .map((choice) => choice.value);

    expect(selected(asUser({}))).toEqual(["list"]);
    expect(selected(asUser({ view: "map" }))).toEqual(["map"]);
  });
});

describe("가는 곳 — 렌즈만 바뀌고 조건은 그대로다 (4.24)", () => {
  it("걸어 둔 조건을 전부 들고 지도로 간다", () => {
    const params = asUser({
      district: "MAPO",
      slot: "DINNER",
      when: "THIS_WEEK",
      scale: "SMALL",
      status: "OPEN",
      mood: MOOD_TAGS[0],
      maxPrice: String(PRICE_CAPS[0].value),
    });

    const next = afterPicking(params, "map");

    expect(next.view).toBe("map");
    expect(next.query).toEqual(params.query);
  });

  it("자격 OFF 는 뷰를 바꿔도 살아나지 않는다 — 어느 방향이든 (4.25)", () => {
    expect(afterPicking(asUser({ eligibleOnly: "0" }), "map").query.eligibleOnly).toBe(false);
    expect(
      afterPicking(asUser({ eligibleOnly: "0", view: "map" }), "list").query.eligibleOnly,
    ).toBe(false);
  });

  it("지도에 없는 정렬도 들고 다닌다 — 리스트로 돌아오면 고른 순서다", () => {
    expect(afterPicking(asUser({ view: "map", sort: "rating" }), "list").query.sort).toBe(
      "rating",
    );
  });

  it("리스트로 가는 주소에는 view 가 실리지 않는다 — 기본값이다 (4.25)", () => {
    const choice = viewChoices(asUser({ view: "map" })).find((item) => item.value === "list");

    expect(choice?.href).not.toContain("view=");
  });

  it("게스트에게 인증 축이 생기지 않는다", () => {
    const next = afterPicking(asGuest({ slot: "DINNER" }), "map");

    expect(next.query.eligibleOnly).toBeUndefined();
    expect(next.query.slot).toBe("DINNER");
  });
});
