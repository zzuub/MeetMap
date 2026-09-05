import { describe, expect, it } from "vitest";
import type { TimeSlot } from "@/entities/event";
import type { CursorPage } from "@/shared/api";
import type { DistrictCode } from "@/shared/config";
import {
  countDistricts,
  countSlots,
  facetQueries,
  itemsOrNull,
} from "./exploreFacets";

/**
 * 패싯 집계 (6.2 시간대 칩 · 6.3 지역 시트).
 *
 * 조회를 실제로 쏘는 `exploreFacets` 자체는 fetch 목이 없어 덮지 못한다(목 API 를
 * 통째로 갈아끼우는 것 말고는 방법이 없다). 대신 **틀리면 화면이 거짓말을 하는 규칙**
 * 셋을 순수 함수로 떼어 여기서 본다 — 축을 푸는 방식, 상한 초과 처리, 버킷팅.
 */
const page = <T,>(items: T[], totalCount = items.length): CursorPage<T> => ({
  items,
  nextCursor: null,
  totalCount,
});

describe("facetQueries — 자기 축만 푼다", () => {
  const query = {
    district: "MAPO",
    slot: "DINNER",
    when: "THIS_WEEK",
    scale: "SMALL",
    eligibleOnly: false,
  } as const;

  it("시간대 집계는 시간대만 풀고 지역은 그대로 둔다", () => {
    // 지역까지 풀면 `오전` 칩이 떠 있는데 눌러서 0건이 나온다 (마포에는 없으므로)
    const { slot } = facetQueries(query);

    expect(slot.slot).toBe("ALL");
    expect(slot.district).toBe("MAPO");
  });

  it("지역 집계는 지역만 풀고 시간대는 그대로 둔다", () => {
    const { district } = facetQueries(query);

    expect(district.district).toBe("ALL");
    expect(district.slot).toBe("DINNER");
  });

  it("나머지 조건은 두 축 모두 그대로 나른다", () => {
    const { slot, district } = facetQueries(query);

    for (const q of [slot, district]) {
      expect(q.when).toBe("THIS_WEEK");
      expect(q.scale).toBe("SMALL");
      // 자격은 게스트에게 없는 축이다 — 있으면 값까지 그대로 가야 한다 (6.1)
      expect(q.eligibleOnly).toBe(false);
    }
  });

  it("게스트의 조건에 인증 축을 만들어내지 않는다", () => {
    const { slot, district } = facetQueries({ when: "LATER" });

    for (const q of [slot, district]) {
      expect(Object.keys(q)).not.toContain("eligibleOnly");
      expect(Object.keys(q)).not.toContain("maxPrice");
    }
  });

  it("원본 조건을 건드리지 않는다", () => {
    const original = { district: "MAPO", slot: "DINNER" } as const;
    facetQueries(original);

    expect(original).toEqual({ district: "MAPO", slot: "DINNER" });
  });
});

describe("itemsOrNull — 상한을 넘기면 부분 집계를 내놓지 않는다", () => {
  it("전부 받았으면 그대로 돌려준다", () => {
    expect(itemsOrNull(page(["a", "b"]))).toEqual(["a", "b"]);
  });

  it("빈 결과도 집계 대상이다 — 0건과 못 셈은 다르다", () => {
    expect(itemsOrNull(page([]))).toEqual([]);
  });

  it("총 건수가 받은 것보다 많으면 `null` 이다", () => {
    // 부분 집계를 그대로 쓰면 있는 구가 목록에서 빠지고 `N곳` 이 거짓말을 한다
    expect(itemsOrNull(page(["a", "b"], 5))).toBeNull();
  });
});

describe("countSlots", () => {
  const items = (slots: TimeSlot[]) => slots.map((timeSlot) => ({ timeSlot }));

  it("슬롯 4종을 모두 채운다 — 0건도 키가 있다", () => {
    const counts = countSlots(items(["DINNER"]));

    expect(Object.keys(counts).sort()).toEqual(
      ["AFTERNOON", "DINNER", "LATE_NIGHT", "MORNING"].sort(),
    );
    expect(counts.MORNING).toBe(0);
  });

  it("같은 슬롯을 누적한다", () => {
    const counts = countSlots(items(["DINNER", "DINNER", "MORNING"]));

    expect(counts.DINNER).toBe(2);
    expect(counts.MORNING).toBe(1);
  });

  it("합이 입력 건수와 같다", () => {
    const input = items(["DINNER", "MORNING", "LATE_NIGHT", "DINNER"]);
    const total = Object.values(countSlots(input)).reduce((a, b) => a + b, 0);

    expect(total).toBe(input.length);
  });
});

describe("countDistricts", () => {
  const items = (districts: DistrictCode[]) => districts.map((district) => ({ district }));

  it("나온 구만 키를 만든다 — 0건인 구는 키가 없다", () => {
    const counts = countDistricts(items(["MAPO", "MAPO", "GANGNAM"]));

    expect(counts).toEqual({ MAPO: 2, GANGNAM: 1 });
    expect(counts.SONGPA).toBeUndefined();
  });

  it("빈 입력은 빈 객체다", () => {
    expect(countDistricts([])).toEqual({});
  });
});
