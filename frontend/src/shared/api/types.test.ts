import { describe, expect, it } from "vitest";
import { emptyPage, paginateArray, type CursorPage } from "./types";

/**
 * 커서 페이지네이션 (dev-plan blocking #7 기본안).
 *
 * 무한 스크롤의 종료 조건이 `nextCursor === null` 하나에 걸려 있다.
 * 여기서 마지막 페이지 판정이 틀리면 목록이 무한히 재요청되거나
 * 마지막 항목들이 영영 안 보인다.
 */
const ITEMS = ["a", "b", "c", "d", "e", "f", "g"];

describe("paginateArray — 정상 경로", () => {
  it("첫 페이지는 커서 없이 시작한다", () => {
    expect(paginateArray(ITEMS, null, 3)).toEqual({
      items: ["a", "b", "c"],
      nextCursor: "3",
      totalCount: 7,
    });
  });

  it("돌려받은 커서로 다음 페이지를 이어간다", () => {
    expect(paginateArray(ITEMS, "3", 3)).toEqual({
      items: ["d", "e", "f"],
      nextCursor: "6",
      totalCount: 7,
    });
  });

  it("마지막 페이지는 nextCursor 가 null 이다", () => {
    // 여기서 null 이 안 나오면 무한 스크롤이 멈추지 않는다
    expect(paginateArray(ITEMS, "6", 3)).toEqual({
      items: ["g"],
      nextCursor: null,
      totalCount: 7,
    });
  });

  it("전체를 한 페이지에 담으면 바로 끝난다", () => {
    expect(paginateArray(ITEMS, null, 100)).toMatchObject({
      items: ITEMS,
      nextCursor: null,
    });
  });

  it("페이지 크기가 정확히 나누어떨어져도 마지막에 빈 페이지를 만들지 않는다", () => {
    // 7개를 7씩 → 딱 떨어짐. nextCursor 가 "7" 이 되면 빈 페이지를 한 번 더 요청한다
    expect(paginateArray(ITEMS, null, 7).nextCursor).toBeNull();

    const four = ["a", "b", "c", "d"];
    expect(paginateArray(four, "2", 2).nextCursor).toBeNull();
  });

  it("모든 페이지를 순회하면 원본이 빠짐없이 나온다", () => {
    const seen: string[] = [];
    let cursor: string | null = null;
    let guard = 0;

    do {
      // 명시 annotation 이 필요하다. cursor 가 page.nextCursor 로 갱신되어
      // 추론이 자기 자신을 참조하는 순환이 된다 (TS7022).
      const page: CursorPage<string> = paginateArray(ITEMS, cursor, 2);
      seen.push(...page.items);
      cursor = page.nextCursor;
    } while (cursor !== null && ++guard < 50);

    expect(seen).toEqual(ITEMS);
    expect(guard).toBeLessThan(50); // 무한 루프에 빠지지 않았다
  });
});

describe("paginateArray — 경계값", () => {
  it("빈 배열은 빈 페이지를 돌려준다", () => {
    expect(paginateArray([], null, 10)).toEqual(emptyPage());
  });

  it("범위를 넘은 커서는 빈 항목 + 종료로 떨어진다", () => {
    expect(paginateArray(ITEMS, "999", 3)).toEqual({
      items: [],
      nextCursor: null,
      totalCount: 7,
    });
  });

  it("숫자가 아닌 커서는 첫 페이지로 되돌리지 않고 빈 페이지를 준다", () => {
    // 0 으로 되돌리면 사용자가 스크롤 중 같은 항목을 다시 보게 된다
    expect(paginateArray(ITEMS, "abc", 3)).toEqual(emptyPage());
  });

  it("음수·소수 커서를 거부한다", () => {
    expect(paginateArray(ITEMS, "-1", 3)).toEqual(emptyPage());
    expect(paginateArray(ITEMS, "1.5", 3)).toEqual(emptyPage());
  });

  it("원본 배열을 변형하지 않는다", () => {
    const frozen = Object.freeze([...ITEMS]);
    paginateArray(frozen, "2", 3);
    expect(frozen).toEqual(ITEMS);
  });

  it("돌려준 items 는 원본과 다른 배열이다", () => {
    const page = paginateArray(ITEMS, null, 100);
    expect(page.items).not.toBe(ITEMS);
  });
});
