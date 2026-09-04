import { describe, expect, it } from "vitest";
import { MOCK_EVENTS } from "../mock/events";
import { isOpen } from "../model/derive";
import { HOME_SECTION_KEYS, type HomeFeed } from "../model/types";
import { openSectionsOnly } from "./eventApi";

/**
 * 실 API 로 전환한 뒤의 방어선 (`ports.ts` 의 `getHomeFeed` 계약).
 *
 * 서버가 마감 건을 섞어 내리면 홈은 그것을 표시할 수단도(상태 배지 없음)
 * 걷어낼 수단도(상태 필터 없음) 없다 → `decisions.md` 4.23.
 */
describe("openSectionsOnly", () => {
  // 섹션이 늘면 이 리터럴이 먼저 컴파일에서 걸린다 — 새 섹션이 조용히 빠지지 않는다
  const feed: HomeFeed = {
    weeklyPopular: [...MOCK_EVENTS],
    myAgeGroup: [...MOCK_EVENTS],
    newlyAdded: [...MOCK_EVENTS],
    baseAreaLabel: "성수동",
  };

  it("세 섹션 전부에서 마감 건을 뺀다", () => {
    const closed = MOCK_EVENTS.filter((event) => !isOpen(event));
    expect(closed.length, "마감 목 데이터가 없으면 이 테스트는 아무것도 못 본다").toBeGreaterThan(0);

    const filtered = openSectionsOnly(feed);

    for (const key of HOME_SECTION_KEYS) {
      expect(filtered[key].every(isOpen), `${key} 에 마감 건이 남았다`).toBe(true);
      expect(filtered[key]).toHaveLength(MOCK_EVENTS.length - closed.length);
    }
  });

  it("모집 중인 건과 그 순서는 건드리지 않는다", () => {
    const open = MOCK_EVENTS.filter(isOpen).map((event) => event.id);

    expect(openSectionsOnly(feed).weeklyPopular.map((event) => event.id)).toEqual(open);
  });

  it("섹션 외 필드는 그대로 둔다", () => {
    expect(openSectionsOnly(feed).baseAreaLabel).toBe(feed.baseAreaLabel);
  });

  it("입력을 변형하지 않는다", () => {
    // 응답 객체를 재사용하는 호출자가 생겨도 안전해야 한다
    openSectionsOnly(feed);

    expect(feed.weeklyPopular).toHaveLength(MOCK_EVENTS.length);
  });
});
