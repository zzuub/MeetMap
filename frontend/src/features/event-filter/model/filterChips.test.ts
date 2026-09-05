import { describe, expect, it } from "vitest";
import { MOOD_TAGS, PRICE_CAPS } from "@/shared/config";
import {
  parseExploreParams,
  serializeExploreParams,
  type ExploreParams,
  type RawSearchParams,
} from "./exploreParams";
import {
  ELIGIBILITY_CHIP_LABEL,
  activeFilterCount,
  appliedFilterChips,
  clearAppliedFilters,
  filterButtonLabel,
  hasViewerAxes,
  resetSheetFilters,
} from "./filterChips";

/**
 * 적용 필터 칩 줄 (6.2 · P1-5c).
 *
 * 이 줄이 하는 일은 둘이다 — **걸린 조건을 보이게** 하고 **풀 수 있게** 한다.
 * 그래서 단언도 둘이다: 조건마다 칩이 뜨는가, 그 칩을 누르면 그 조건만 빠지는가.
 *
 * 입력을 `parseExploreParams` 로 만든다. 객체를 손으로 지으면 게스트에게 키가 없는
 * 실제 형태(6.1)를 흉내내다 틀리고, 그러면 게스트 케이스가 거짓으로 통과한다.
 */
const asUser = (params: RawSearchParams) => parseExploreParams(params, { isGuest: false });
const asGuest = (params: RawSearchParams) => parseExploreParams(params, { isGuest: true });

const keys = (params: ExploreParams) => appliedFilterChips(params).map((chip) => chip.key);

/** 칩의 해제 주소를 다시 읽어 "그 조건만 빠졌는지" 본다 */
function afterRemoving(params: ExploreParams, key: string): ExploreParams {
  const chip = appliedFilterChips(params).find((c) => c.key === key);
  if (!chip) throw new Error("칩이 없다: " + key);

  const search = chip.href.split("?")[1] ?? "";
  return parseExploreParams(Object.fromEntries(new URLSearchParams(search)), {
    isGuest: !hasViewerAxes(params),
  });
}

describe("표시 대상", () => {
  it("조건이 없으면 칩이 하나도 없다 — 줄 자체를 그리지 않기 위한 조건이다", () => {
    expect(keys(asGuest({}))).toEqual([]);
  });

  it("일정·규모·가격·모집 상태가 각각 칩이 된다", () => {
    const params = asUser({
      when: "THIS_WEEK",
      scale: "SMALL",
      maxPrice: String(PRICE_CAPS[0].value),
      status: "OPEN",
      eligibleOnly: "0",
    });

    expect(keys(params)).toEqual(["when", "scale", "maxPrice", "status"]);
  });

  it("분위기는 선택한 태그마다 개별 칩이다", () => {
    const params = asUser({
      mood: MOOD_TAGS[0] + "," + MOOD_TAGS[1],
      eligibleOnly: "0",
    });

    expect(keys(params)).toEqual(["mood:" + MOOD_TAGS[0], "mood:" + MOOD_TAGS[1]]);
  });

  it("지역·시간대·정렬은 칩이 되지 않는다 — 각각 다른 UI 가 이미 보여준다", () => {
    expect(keys(asGuest({ district: "MAPO", slot: "DINNER", sort: "latest" }))).toEqual([]);
  });

  it("라벨이 사양 문구 그대로다", () => {
    const labels = appliedFilterChips(
      asUser({ when: "THIS_WEEK", maxPrice: String(PRICE_CAPS[0].value), status: "OPEN" }),
    ).map((chip) => chip.label);

    expect(labels).toContain("이번 주");
    expect(labels).toContain(ELIGIBILITY_CHIP_LABEL);
    expect(labels).toContain(PRICE_CAPS[0].label + " 이하");
    expect(labels).toContain("신청 가능만");
  });

  it("해제 버튼의 접근 이름이 `{조건명} 필터 해제` 다", () => {
    const [chip] = appliedFilterChips(asGuest({ when: "LATER" }));
    expect(chip.removeLabel).toBe("그 이후 필터 해제");
  });
});

describe("자격 칩", () => {
  it("로그인 사용자에게는 파라미터가 없어도 뜬다 — 기본 ON 이라는 고지다", () => {
    expect(keys(asUser({}))).toContain("eligibleOnly");
  });

  it("게스트에게는 뜨지 않는다 — 판정 근거가 없어 축 자체가 없다", () => {
    expect(keys(asGuest({ eligibleOnly: "1" }))).not.toContain("eligibleOnly");
  });

  it("해제하면 파라미터가 사라지는 게 아니라 `0` 이 된다", () => {
    const [chip] = appliedFilterChips(asUser({}));

    expect(chip.key).toBe("eligibleOnly");
    // 지우면 기본값(ON)으로 되살아나 칩이 그대로 다시 뜬다 (`decisions.md` 4.25)
    expect(chip.href).toContain("eligibleOnly=0");
    expect(afterRemoving(asUser({}), "eligibleOnly").query.eligibleOnly).toBe(false);
    expect(keys(afterRemoving(asUser({}), "eligibleOnly"))).toEqual([]);
  });
});

describe("개별 해제 — 누른 조건만 빠진다", () => {
  const applied = asUser({
    when: "THIS_WEEK",
    slot: "DINNER",
    district: "MAPO",
    scale: "SMALL",
    maxPrice: String(PRICE_CAPS[0].value),
    status: "OPEN",
    sort: "latest",
    mood: MOOD_TAGS[0] + "," + MOOD_TAGS[1],
  });

  it("일정 칩은 일정만 되돌린다", () => {
    expect(afterRemoving(applied, "when").query.when).toBe("ALL");
    expect(afterRemoving(applied, "when").query.scale).toBe("SMALL");
  });

  it("분위기 칩은 그 태그만 빼고 나머지 선택을 남긴다", () => {
    expect(afterRemoving(applied, "mood:" + MOOD_TAGS[0]).query.mood).toEqual([MOOD_TAGS[1]]);
  });

  it("마지막 분위기 태그를 빼면 축 자체가 사라진다", () => {
    const one = asUser({ mood: MOOD_TAGS[0] });
    expect(afterRemoving(one, "mood:" + MOOD_TAGS[0]).query.mood).toBeUndefined();
  });

  it("가격 칩은 상한만 푼다", () => {
    expect(afterRemoving(applied, "maxPrice").query.maxPrice).toBeUndefined();
  });

  it("어떤 칩을 눌러도 시간대·지역·정렬은 남는다", () => {
    for (const key of keys(applied)) {
      const { query } = afterRemoving(applied, key);
      expect({ slot: query.slot, district: query.district, sort: query.sort }).toEqual({
        slot: "DINNER",
        district: "MAPO",
        sort: "latest",
      });
    }
  });
});

/**
 * 초기화가 **둘**이고 지우는 대상이 다르다 (`decisions.md` 4.26).
 * 이름만 같다고 한쪽 규칙을 다른 쪽에 옮겨 붙이면 두 사양 중 하나가 반드시 깨진다.
 */
describe("초기화 두 가지", () => {
  const applied = asUser({
    when: "THIS_WEEK",
    slot: "DINNER",
    district: "MAPO",
    scale: "SMALL",
    maxPrice: String(PRICE_CAPS[0].value),
    status: "OPEN",
    mood: MOOD_TAGS[0] + "," + MOOD_TAGS[2],
  });

  it("칩 줄의 초기화는 떠 있던 칩을 전부 없앤다 (자격 포함)", () => {
    const next = clearAppliedFilters(applied);

    expect(appliedFilterChips(next)).toEqual([]);
    expect(next.query.eligibleOnly).toBe(false);
  });

  it("칩 줄의 초기화도 시간대·지역은 남긴다", () => {
    const next = clearAppliedFilters(applied);

    expect(next.query.slot).toBe("DINNER");
    expect(next.query.district).toBe("MAPO");
  });

  it("게스트의 초기화는 자격 축을 만들어내지 않는다", () => {
    // 게스트 주소에 eligibleOnly 가 붙으면 6.1 의 '게스트 미노출' 이 깨진다
    const next = clearAppliedFilters(asGuest({ when: "LATER", status: "OPEN" }));

    expect(next.query.eligibleOnly).toBeUndefined();
    expect(serializeExploreParams(next)).not.toContain("eligibleOnly");
  });

  it("시트의 초기화는 2·3층만 되돌리고 자격 토글을 건드리지 않는다", () => {
    const next = resetSheetFilters(applied);

    expect(next.query.eligibleOnly).toBe(true);
    expect(next.query).toMatchObject({ when: "ALL", scale: "ALL", status: "ALL" });
    expect(next.query.mood).toBeUndefined();
    expect(next.query.maxPrice).toBeUndefined();
  });

  it("시트의 초기화는 2층이라 시간대를 되돌린다 — 칩 줄 쪽과 반대다", () => {
    expect(resetSheetFilters(applied).query.slot).toBe("ALL");
    expect(clearAppliedFilters(applied).query.slot).toBe("DINNER");
  });

  it("두 초기화 모두 지역·정렬·뷰는 건드리지 않는다", () => {
    const base = asUser({ view: "map", district: "MAPO", sort: "rating", when: "LATER" });

    for (const next of [clearAppliedFilters(base), resetSheetFilters(base)]) {
      expect(next.view).toBe("map");
      expect(next.query).toMatchObject({ district: "MAPO", sort: "rating" });
    }
  });
});

/**
 * **축을 빼면 키 자체가 남지 않는다.**
 *
 * `mood: []` 와 `maxPrice: undefined` 는 직렬화에서 걸러져 URL 로는 티가 안 난다 —
 * 그래서 왕복으로 확인하면 이 규칙이 통째로 비어 있어도 테스트가 통과한다(변이로
 * 확인했다). 조건 객체를 직접 본다.
 *
 * 지키는 이유는 둘이다. ① 같은 뜻을 두 가지로 표현하면 언젠가 `if (query.mood)`
 * 같은 참조식이 들어와 갈린다. ② 게스트 조건 객체에 인증 축의 키가 생기면
 * `"maxPrice" in query` 로 게스트를 판정하는 코드가 조용히 틀린다 (6.1).
 */
describe("축을 빼면 키가 남지 않는다", () => {
  it("마지막 분위기 태그를 빼면 `mood` 키가 사라진다", () => {
    const one = asUser({ mood: MOOD_TAGS[0] });
    const cleared = clearAppliedFilters(one);

    expect(Object.keys(cleared.query)).not.toContain("mood");
  });

  it("가격 상한을 풀면 `maxPrice` 키가 사라진다", () => {
    const priced = asUser({ maxPrice: String(PRICE_CAPS[0].value) });

    expect(Object.keys(clearAppliedFilters(priced).query)).not.toContain("maxPrice");
    expect(Object.keys(resetSheetFilters(priced).query)).not.toContain("maxPrice");
  });

  it("게스트를 초기화해도 인증 축의 키가 생기지 않는다", () => {
    const guest = asGuest({ when: "LATER", mood: MOOD_TAGS[0] });

    for (const next of [clearAppliedFilters(guest), resetSheetFilters(guest)]) {
      expect(Object.keys(next.query)).not.toContain("maxPrice");
      expect(Object.keys(next.query)).not.toContain("eligibleOnly");
    }
  });
});

describe("hasViewerAxes", () => {
  it("게스트와 로그인 사용자를 키의 유무로 가른다", () => {
    expect(hasViewerAxes(asUser({}))).toBe(true);
    expect(hasViewerAxes(asGuest({}))).toBe(false);
  });

  it("상한을 안 걸었어도 로그인 사용자는 참이다 — `maxPrice` 로 판정하면 틀린다", () => {
    expect(asUser({}).query.maxPrice).toBeUndefined();
    expect(hasViewerAxes(asUser({}))).toBe(true);
  });
});

describe("활성 필터 개수 (6.2)", () => {
  it("지역·시간대·자격은 세지 않는다", () => {
    expect(activeFilterCount(asUser({ district: "MAPO", slot: "DINNER" }))).toBe(0);
  });

  it("분위기는 선택 수만큼 더한다", () => {
    const params = asUser({ mood: MOOD_TAGS[0] + "," + MOOD_TAGS[1], when: "LATER" });
    expect(activeFilterCount(params)).toBe(3);
  });

  it("게스트에게는 가격이 세어지지 않는다 — 그룹 자체가 없다", () => {
    const raw = { maxPrice: String(PRICE_CAPS[0].value) };
    expect(activeFilterCount(asUser(raw))).toBe(1);
    expect(activeFilterCount(asGuest(raw))).toBe(0);
  });
});

describe("필터 버튼 라벨 (6.2)", () => {
  it("칩 줄이 떠 있으면 개수를 붙이지 않는다 — 같은 정보의 중복이다", () => {
    expect(filterButtonLabel(asUser({ when: "LATER", scale: "SMALL" }))).toBe("필터");
  });

  it("조건이 없으면 그냥 `필터` 다", () => {
    expect(filterButtonLabel(asGuest({}))).toBe("필터");
  });
});
