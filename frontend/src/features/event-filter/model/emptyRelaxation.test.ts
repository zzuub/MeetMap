import type { EventListQuery } from "@/entities/event";
import { DEFAULT_PROVINCE } from "@/shared/config";
import { describe, expect, it } from "vitest";
import { exploreHref, parseExploreParams, type ExploreParams } from "./exploreParams";
import { emptyRelaxation } from "./filterChips";

/**
 * **0건을 만들 수 있는 축을 전부 적는다.**
 *
 * `필터 초기화` 를 상수로 박으면 칩이 없는 0건(지역만 좁힘 · 시간대만 좁힘 ·
 * URL 로만 들어오는 `area`)에서 **아무것도 안 바뀌는 링크**가 된다. 그 경우들을
 * "떠올린 것만" 확인하지 않으려고 `Record<keyof EventListQuery, …>` 로 잡았다 —
 * 조회 축이 하나 늘면 이 파일이 **컴파일 에러**로 판정을 요구한다.
 */

/** 그 축이 0건의 원인이 될 수 있는가, 될 수 있다면 빈 상태가 어떻게 푸는가 */
type AxisVerdict =
  /** 결과 집합을 바꾸지 않는다 — 0건의 원인일 수 없다 */
  | { relaxes: false }
  /** 이 축만 걸었을 때 나오는 액션 라벨 */
  | { relaxes: true; label: string; query: Partial<EventListQuery> };

const AXES: Record<keyof EventListQuery, AxisVerdict> = {
  // 서울 고정. 화면에도 URL 에도 다른 값이 들어올 자리가 없다 (MVP1)
  province: { relaxes: false },
  sort: { relaxes: false },
  providerId: { relaxes: false },
  cursor: { relaxes: false },
  limit: { relaxes: false },

  area: {
    relaxes: true,
    label: "'성수·건대' 조건 지우기",
    query: { area: "성수·건대" },
  },
  district: { relaxes: true, label: "서울 전지역 보기", query: { district: "GANGBUK" } },
  slot: { relaxes: true, label: "시간대 전체 보기", query: { slot: "MORNING" } },

  // 아래 여섯은 전부 적용 필터 칩 줄이 그리는 축이다 → 하나의 `필터 초기화`
  when: { relaxes: true, label: "필터 초기화", query: { when: "THIS_WEEK" } },
  scale: { relaxes: true, label: "필터 초기화", query: { scale: "SMALL" } },
  status: { relaxes: true, label: "필터 초기화", query: { status: "OPEN" } },
  mood: { relaxes: true, label: "필터 초기화", query: { mood: ["차분한"] } },
  maxPrice: { relaxes: true, label: "필터 초기화", query: { maxPrice: 30000 } },
  eligibleOnly: { relaxes: true, label: "필터 초기화", query: { eligibleOnly: true } },
};

const AXIS_NAMES = Object.keys(AXES) as (keyof EventListQuery)[];

function params(query: Partial<EventListQuery> = {}): ExploreParams {
  return { view: "list", query: { province: DEFAULT_PROVINCE, ...query } };
}

describe("0건 빈 상태의 액션", () => {
  it("조회 축을 하나도 빠뜨리지 않았다", () => {
    expect(AXIS_NAMES).toHaveLength(14);
  });

  for (const axis of AXIS_NAMES) {
    const verdict = AXES[axis];

    if (!verdict.relaxes) continue;

    it(`${axis} 만 걸린 0건 → \`${verdict.label}\``, () => {
      expect(emptyRelaxation(params(verdict.query))?.label).toBe(verdict.label);
    });

    it(`${axis} 를 푸는 링크는 실제로 조건을 바꾼다`, () => {
      const current = params(verdict.query);
      const relaxation = emptyRelaxation(current);

      // **여기가 핵심 단언이다.** 라벨이 맞아도 목적지가 같은 주소면 눌러도 같은
      // 빈 화면이 다시 뜬다 — 11.2 를 문구로만 지키는 상태.
      expect(relaxation).not.toBeNull();
      expect(relaxation?.href).not.toBe(exploreHref(current));
    });
  }

  it("걸린 조건이 없으면 풀 것도 없다 (`null`)", () => {
    expect(emptyRelaxation(params())).toBeNull();
  });

  it("보이지 않는 축(`area`)을 칩보다 먼저 푼다", () => {
    // 둘 다 걸렸을 때. `area` 는 화면 어디에도 컨트롤이 없어 여기서 안 풀면 못 푼다
    const both = params({ area: "성수·건대", when: "THIS_WEEK" });
    expect(emptyRelaxation(both)?.label).toBe("'성수·건대' 조건 지우기");
  });

  it("칩이 있으면 지역·시간대보다 `필터 초기화` 가 먼저다 (11.2)", () => {
    const many = params({ district: "GANGBUK", slot: "MORNING", when: "THIS_WEEK" });
    expect(emptyRelaxation(many)?.label).toBe("필터 초기화");
  });

  /**
   * 매 단계가 참인지 본다 — 액션을 계속 눌러 나가면 **조건이 없는 상태에 도달**하고
   * 그때 `null` 이 된다. 중간에 제자리를 도는 단계가 있으면 여기서 멈추지 않는다.
   */
  it("반복해서 누르면 모든 조건이 풀린다", () => {
    let current = params({
      area: "성수·건대",
      district: "GANGBUK",
      slot: "MORNING",
      when: "THIS_WEEK",
      mood: ["차분한", "편안한"],
      maxPrice: 30000,
      status: "OPEN",
    });

    const seen = new Set<string>();

    for (let step = 0; step < 10; step += 1) {
      const relaxation = emptyRelaxation(current);
      if (relaxation === null) break;

      expect(seen.has(relaxation.href)).toBe(false);
      seen.add(relaxation.href);
      current = fromHref(relaxation.href);
    }

    expect(emptyRelaxation(current)).toBeNull();
  });
});

/* ── 내부 ───────────────────────────────────────────────── */

/** 액션의 주소를 다시 조건으로 읽는다 — 왕복이 성립해야 다음 단계를 밟을 수 있다 */
function fromHref(href: string): ExploreParams {
  const search = new URL(href, "http://localhost").searchParams;
  return parseExploreParams(Object.fromEntries(search), { hasViewer: true });
}
