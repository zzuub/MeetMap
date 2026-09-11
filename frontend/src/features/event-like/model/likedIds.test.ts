import { describe, expect, it } from "vitest";
import { toggleLikedId } from "./likedIds";

/**
 * 찜 목록이 카드를 지우는 근거 (`decisions.md` 4.64).
 *
 * 클릭 → 이 함수 → 목록의 필터 중 **DOM 이 필요한 것은 클릭뿐**이다. 나머지 둘을
 * 정적으로 잠가 두면 "즉시 제거"가 브라우저 전용 항목(4.61 목록)으로 늘지 않는다.
 */
describe("찜 낙관 갱신", () => {
  it("찜한 것을 누르면 빠진다", () => {
    expect(toggleLikedId(["a", "b", "c"], "b")).toEqual(["a", "c"]);
  });

  it("찜하지 않은 것을 누르면 뒤에 붙는다", () => {
    expect(toggleLikedId(["a"], "b")).toEqual(["a", "b"]);
  });

  it("앞부분이 같은 다른 id 는 건드리지 않는다", () => {
    // `startsWith`·부분 일치로 바꾸는 실수를 잠근다
    expect(toggleLikedId(["evt-1", "evt-10"], "evt-1")).toEqual(["evt-10"]);
  });

  it("입력 배열을 바꾸지 않는다 — `useOptimistic` 의 기준값은 서버 prop 이다", () => {
    const base = Object.freeze(["a"]);

    toggleLikedId(base, "a");
    toggleLikedId(base, "b");

    expect(base).toEqual(["a"]);
  });
});
