import { describe, expect, it } from "vitest";
import { trendChange, trendChangeLabel } from "./change";

/** 인기 검색어 증감 (11.1 `+N / — / -N / new` · `decisions.md` 4.68) */
describe("trendChange", () => {
  it("직전 순위보다 올라가면 오른 칸 수다", () => {
    expect(trendChange(2, 5)).toEqual({ kind: "up", by: 3 });
  });

  it("내려가면 내려간 칸 수다", () => {
    expect(trendChange(4, 1)).toEqual({ kind: "down", by: 3 });
  });

  it("같으면 변동 없음이다", () => {
    expect(trendChange(3, 3)).toEqual({ kind: "same" });
  });

  it("직전 순위표에 없었으면 new 다 — 0 이나 음수로 셈하지 않는다", () => {
    expect(trendChange(1, null)).toEqual({ kind: "new" });
  });
});

describe("trendChangeLabel", () => {
  it("보이는 표기가 11.1 의 네 모양이다", () => {
    expect(trendChangeLabel({ kind: "up", by: 2 }).text).toBe("+2");
    expect(trendChangeLabel({ kind: "down", by: 1 }).text).toBe("-1");
    expect(trendChangeLabel({ kind: "same" }).text).toBe("—");
    expect(trendChangeLabel({ kind: "new" }).text).toBe("new");
  });

  it("스크린리더 문구는 기호가 아니라 말이다 — `+2` 는 `플러스 2` 로, `—` 는 안 읽힌다", () => {
    expect(trendChangeLabel({ kind: "up", by: 2 }).description).toBe("2계단 상승");
    expect(trendChangeLabel({ kind: "down", by: 1 }).description).toBe("1계단 하락");
    expect(trendChangeLabel({ kind: "same" }).description).toBe("순위 변동 없음");
    expect(trendChangeLabel({ kind: "new" }).description).toBe("새로 진입");
  });
});
