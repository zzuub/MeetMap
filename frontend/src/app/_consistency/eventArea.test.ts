import { describe, expect, it } from "vitest";
import { eventApi } from "@/entities/event";
import { nearestArea } from "@/entities/geo";

/**
 * **목 회차의 좌표와 `area` 가 어긋나지 않는지** 본다 (`decisions.md` 4.21 의 자리).
 *
 * 두 값이 갈리면 위치 권한 화면(4.2)이 거짓말을 한다 — 성수에 서 있는 사용자에게
 * `강남·역삼 기준으로 …` 을 보여주고, `주변 소개팅 보기` 가 그 사람 근처에 없는
 * 목록을 연다. 좌표는 `entities/event` 에, 대표 좌표는 `shared/config` 에, 판정은
 * `entities/geo` 에 있어 **셋을 함께 볼 수 있는 자리가 `app` 뿐**이다.
 *
 * ⚠️ `AREA_CENTERS` 는 목 회차 좌표를 베끼지 않았다 — 베꼈으면 이 검사가 공허하다.
 * 슬라이스 내부가 아니라 **공개 API 로만** 접근한다 (`providerRating.test.ts` 와 같다).
 */
describe("목 회차의 좌표는 자기 지역으로 되돌아온다", () => {
  it("좌표와 `area` 가 모든 회차에서 일치한다", async () => {
    const page = await eventApi.getList({ cursor: null, limit: SCAN_ALL });

    // 스캔이 0건이면 아래 단언이 공허하게 통과한다 (`_guard.test.ts` 와 같은 자기 점검)
    expect(page.items.length).toBe(page.totalCount);
    expect(page.items.length).toBeGreaterThan(0);

    const mismatched = page.items
      .filter((event) => nearestArea({ lat: event.lat, lng: event.lng }) !== event.area)
      .map((event) => `${event.id}: ${event.area} ≠ ${nearestArea(event)}`);

    expect(mismatched).toEqual([]);
  });
});

/** 목 전체를 한 페이지에 담기 위한 값. 실제 목은 한 자릿수다 */
const SCAN_ALL = 100;
