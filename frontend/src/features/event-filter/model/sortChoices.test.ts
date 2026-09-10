import { describe, expect, it } from "vitest";
import { DEFAULT_SORT, PRICE_CAPS, SORT_OPTIONS, VIEWER_SORTS } from "@/shared/config";
import {
  parseExploreParams,
  type ExploreParams,
  type RawSearchParams,
} from "./exploreParams";
import { sortChoices } from "./sortChoices";

/**
 * 정렬 `select` 의 선택지 (6.2).
 *
 * 이 모듈이 답하는 것은 둘이다 — **무엇을 보여주나**(게스트는 가격 정렬을 못 본다)와
 * **어디로 가나**(정렬만 바뀌고 걸어둔 조건은 그대로다).
 *
 * 입력을 `parseExploreParams` 로 만든다. 객체를 손으로 지으면 게스트에게 인증 축이
 * 없는 실제 형태(6.1)를 흉내내다 틀리고, 그러면 게스트 케이스가 거짓으로 통과한다.
 */
const asUser = (params: RawSearchParams) => parseExploreParams(params, { hasViewer: true });
const asGuest = (params: RawSearchParams) => parseExploreParams(params, { hasViewer: false });

const codes = (params: ExploreParams) => sortChoices(params).map((choice) => choice.code);

/** 선택지의 주소를 다시 읽어 "정렬만 바뀌었는지" 본다 */
function afterPicking(params: ExploreParams, code: string): ExploreParams {
  const choice = sortChoices(params).find((item) => item.code === code);
  if (!choice) throw new Error("선택지가 없다: " + code);

  const search = choice.href.split("?")[1] ?? "";
  return parseExploreParams(Object.fromEntries(new URLSearchParams(search)), {
    hasViewer: params.query.eligibleOnly !== undefined,
  });
}

describe("보여주는 것", () => {
  it("로그인 사용자는 5종을 전부 본다", () => {
    expect(codes(asUser({}))).toEqual(SORT_OPTIONS.map((option) => option.code));
  });

  it("게스트는 가격 정렬만 못 본다 — 평점 정렬은 본다", () => {
    // 평점은 주최사 `ratingScore` 기준이라 인증 주체가 필요 없다 (4.20)
    const guest = codes(asGuest({}));

    for (const sort of VIEWER_SORTS) expect(guest).not.toContain(sort);
    expect(guest).toContain("rating");
    expect(guest).toContain("popular");
    expect(guest).toContain("latest");
  });

  it("게스트 판정은 세션이 아니라 인증 축의 유무다", () => {
    // 게이트가 두 곳이 되면 언젠가 한쪽만 고쳐진다 (4.27).
    // 게스트에게는 `eligibleOnly` 키 자체가 없고, 그것이 곧 판정 근거다
    expect(asGuest({}).query.eligibleOnly).toBeUndefined();
    expect(asUser({ eligibleOnly: "0" }).query.eligibleOnly).toBe(false);

    // 자격을 껐다고 가격 정렬이 사라지지는 않는다 — 다른 축이다
    for (const sort of VIEWER_SORTS) {
      expect(codes(asUser({ eligibleOnly: "0" }))).toContain(sort);
    }
  });

  it("현재 정렬 하나만 selected 다", () => {
    const selected = sortChoices(asUser({ sort: "rating" })).filter((c) => c.selected);

    expect(selected.map((choice) => choice.code)).toEqual(["rating"]);
  });

  it("정렬을 안 걸었으면 기본값이 selected 다", () => {
    const selected = sortChoices(asUser({})).filter((choice) => choice.selected);

    expect(selected.map((choice) => choice.code)).toEqual([DEFAULT_SORT]);
  });

  it("게스트가 손으로 붙인 가격 정렬에서도 selected 가 비지 않는다", () => {
    // 파싱이 기본값으로 떨어뜨리므로(4.30) `select` 가 아무것도 고르지 않은 상태로
    // 뜨는 경로가 없다. 이 단언이 깨지면 게이트가 화면으로 새어나온 것이다
    const guest = asGuest({ sort: VIEWER_SORTS[0] });
    const selected = sortChoices(guest).filter((choice) => choice.selected);

    expect(selected.map((choice) => choice.code)).toEqual([DEFAULT_SORT]);
  });
});

describe("가는 곳", () => {
  it("정렬만 바뀌고 걸어둔 조건은 그대로다", () => {
    // 주소를 손으로 만들면 여기가 깨진다 — `exploreHref` 를 거치는 이유다 (4.24)
    const params = asUser({
      district: "MAPO",
      slot: "DINNER",
      when: "THIS_WEEK",
      scale: "SMALL",
      status: "OPEN",
      maxPrice: String(PRICE_CAPS[0].value),
    });

    const next = afterPicking(params, "latest");

    expect(next.query.sort).toBe("latest");
    expect({ ...next.query, sort: params.query.sort }).toEqual(params.query);
  });

  it("자격 OFF 는 정렬을 바꿔도 살아나지 않는다", () => {
    // `?sort=` 만 갈아끼우면 `eligibleOnly=0` 이 떨어져 기본값(ON)으로 되살아난다 (4.25)
    const params = asUser({ eligibleOnly: "0" });

    expect(afterPicking(params, "rating").query.eligibleOnly).toBe(false);
  });

  it("기본 정렬로 되돌아가는 주소에는 sort 가 실리지 않는다", () => {
    // 기본값은 URL 에 싣지 않는다 (4.25)
    const choice = sortChoices(asUser({ sort: "rating" })).find(
      (item) => item.code === DEFAULT_SORT,
    );

    expect(choice?.href).not.toContain("sort=");
  });

  it("지도 뷰에서도 view 축이 유지된다", () => {
    // 정렬은 렌즈를 바꾸지 않는다. 지도에서 고른 정렬이 리스트로 튕기면 안 된다
    const choice = sortChoices(asUser({ view: "map" })).find(
      (item) => item.code === "latest",
    );

    expect(choice?.href).toContain("view=map");
  });
});
