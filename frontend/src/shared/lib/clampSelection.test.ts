import { describe, expect, it } from "vitest";
import { clampSelection } from "./clampSelection";

/**
 * 상한이 있는 다중 선택 (3.4 관심 카테고리 5개 / 선호 지역 3개, 8장 비교함 3개).
 *
 * 핵심은 `exceeded` 다. 목업은 한도 초과 시 클릭을 무시만 해서 사용자가 원인을
 * 알 수 없었고(16장 지적), 그래서 "거부했다"는 사실을 호출부에 알려 토스트를
 * 띄우게 만든 것이 이 함수의 존재 이유다.
 */
describe("clampSelection", () => {
  it("선택되지 않은 값을 추가한다", () => {
    expect(clampSelection(["와인"], "러닝", 3)).toEqual({
      next: ["와인", "러닝"],
      exceeded: false,
    });
  });

  it("이미 선택된 값을 다시 누르면 해제한다", () => {
    expect(clampSelection(["와인", "러닝"], "와인", 3)).toEqual({
      next: ["러닝"],
      exceeded: false,
    });
  });

  it("한도에 도달하면 추가를 거부하고 exceeded 를 알린다", () => {
    expect(clampSelection(["a", "b", "c"], "d", 3)).toEqual({
      next: ["a", "b", "c"],
      exceeded: true,
    });
  });

  it("한도에 도달했어도 해제는 막지 않는다", () => {
    // 가득 찬 상태에서 선택을 못 바꾸면 사용자가 갇힌다
    expect(clampSelection(["a", "b", "c"], "b", 3)).toEqual({
      next: ["a", "c"],
      exceeded: false,
    });
  });

  it("원본 배열을 변형하지 않는다", () => {
    const original = ["a", "b"];
    const frozen = Object.freeze([...original]);

    clampSelection(frozen, "c", 5);
    clampSelection(frozen, "a", 5);
    clampSelection(frozen, "c", 2); // 한도 초과 경로

    expect(frozen).toEqual(original);
  });

  it("한도 초과 시에도 새 배열을 돌려준다", () => {
    // 같은 참조를 돌려주면 React 상태 업데이트가 무시된다
    const current = ["a", "b", "c"];
    const { next } = clampSelection(current, "d", 3);
    expect(next).not.toBe(current);
    expect(next).toEqual(current);
  });

  it("한도가 0이면 아무것도 선택할 수 없다", () => {
    expect(clampSelection([], "a", 0)).toEqual({ next: [], exceeded: true });
  });

  it("객체 값도 참조 동일성으로 처리한다", () => {
    const a = { id: 1 };
    const b = { id: 2 };
    expect(clampSelection([a], b, 2).next).toEqual([a, b]);
    expect(clampSelection([a, b], a, 2).next).toEqual([b]);
    // 값이 같아도 참조가 다르면 다른 항목이다
    expect(clampSelection([a], { id: 1 }, 2).next).toHaveLength(2);
  });
});
