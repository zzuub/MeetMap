import { describe, expect, it, vi } from "vitest";
import { applyFilters, mockEventApi } from "../api/eventApi.mock";
import type { EventSummary } from "../model/types";
import { getMockEvents } from "./events";

/**
 * 목 회차의 **주 넘김 동작** (`decisions.md` 4.31).
 *
 * 날짜가 이번 주 월요일 기준 상대값이라, 모듈 로드 때 한 번 굳히면 개발 서버를
 * 켜둔 채 주가 넘어갔을 때 `when=THIS_WEEK` 가 조용히 틀어진다. 여기가 그
 * 자동 복구를 잠그는 자리다.
 *
 * 이 파일만 가짜 타이머를 쓴다. 주 넘김은 **시각이 흐르는 것 자체가 입력**이라
 * 순수 함수로 떼어낼 수가 없다.
 */
describe("getMockEvents", () => {
  it("서버를 켜둔 채 주가 넘어가도 이번 주 건수가 유지된다", () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      vi.setSystemTime(new Date("2026-09-13T23:00:00+09:00")); // 일요일 밤
      const stale = getMockEvents();
      expect(applyFilters(stale, { when: "THIS_WEEK" })).toHaveLength(5);

      vi.setSystemTime(new Date("2026-09-14T09:00:00+09:00")); // 월요일 아침

      // 굳은 배열을 계속 쓰면 이렇게 된다 — **0건이 아니라 조용히 틀린 건수**다.
      // 화면이 비면 눈에 띄지만, 5건이 2건이 되는 것은 아무도 못 알아챈다
      expect(applyFilters(stale, { when: "THIS_WEEK" })).toHaveLength(2);

      // 주가 바뀌었으므로 다시 만들어 복구한다
      const fresh = getMockEvents();
      expect(applyFilters(fresh, { when: "THIS_WEEK" })).toHaveLength(5);
      expect(fresh).not.toBe(stale);
    } finally {
      vi.useRealTimers();
    }
  });

  /**
   * 4.28 — 목록 조회와 패싯 스캔이 같은 스냅샷을 봐야 한다. 요청마다 다시 만들면
   * 그 전제가 깨지므로, 주가 같으면 **같은 배열 참조**여야 한다.
   */
  it("같은 주 안에서는 같은 배열 참조를 돌려준다", () => {
    vi.useFakeTimers({ toFake: ["Date"] });

    try {
      // 위 테스트가 쓰지 않는 주를 고른다. 모듈 스코프 캐시를 두 테스트가
      // 공유하므로, 같은 주를 쓰면 이 단언이 **앞 테스트가 만들어 둔 배열**을
      // 보게 되어 실행 순서에 기대게 된다
      vi.setSystemTime(new Date("2026-10-05T09:00:00+09:00")); // 월요일
      const first = getMockEvents();

      vi.setSystemTime(new Date("2026-10-11T23:59:00+09:00")); // 같은 주 일요일
      expect(getMockEvents()).toBe(first);
    } finally {
      vi.useRealTimers();
    }
  });
});

/**
 * 캐시 오염 방지 (`decisions.md` 4.31).
 *
 * 응답으로 나간 회차 객체는 **캐시가 들고 있는 그 인스턴스가 아니어야** 한다.
 * 그대로 넘기면 화면의 `event.isLiked = true` 한 줄이 같은 주의 모든 요청에 남는다.
 * 타입(`Readonly<EventDetail>`)은 목 내부만 막고 `EventApi` 포트 밖에서는 지워지므로
 * 런타임 방어가 따로 필요하다.
 *
 * **메서드를 하나씩 지목하지 않고 전부 훑는다.** 처음에는 `getDetail` 만 고치고
 * "유일한 자리"라고 단언했는데 넷이 새고 있었다 (PR #27 5차 리뷰). 새 메서드가
 * 생기면 이 표에 줄을 더하는 것이 규칙이다.
 */
describe("캐시 오염 방지", () => {
  const cachedIds = () => getMockEvents().map((event) => event.id);

  /** 응답에서 회차를 꺼내는 방법. 회차를 돌려주는 메서드는 전부 여기 있어야 한다 */
  const paths: [name: string, take: () => Promise<EventSummary[]>][] = [
    ["getHomeFeed · weeklyPopular", async () => (await mockEventApi.getHomeFeed({})).weeklyPopular],
    ["getHomeFeed · myAgeGroup", async () => (await mockEventApi.getHomeFeed({})).myAgeGroup],
    ["getHomeFeed · newlyAdded", async () => (await mockEventApi.getHomeFeed({})).newlyAdded],
    ["getList", async () => (await mockEventApi.getList({ limit: 20 })).items],
    ["getDetail", async () => [await mockEventApi.getDetail(cachedIds()[0])]],
    ["getMapMarkers", async () => mockEventApi.getMapMarkers({})],
    ["search", async () => mockEventApi.search("소개팅")],
  ];

  it("회차를 돌려주는 메서드를 다 덮는다", () => {
    // 이 단언이 깨지면 위 표에 빠진 메서드가 있다는 뜻이다
    const covered = new Set(paths.map(([name]) => name.split(" · ")[0]));
    const returnsEvents = ["getHomeFeed", "getList", "getDetail", "getMapMarkers", "search"];

    expect([...covered].sort()).toEqual([...returnsEvents].sort());
  });

  it.each(paths)("%s 가 캐시 인스턴스를 그대로 넘기지 않는다", async (_name, take) => {
    const cache = getMockEvents();
    const returned = await take();

    expect(returned.length).toBeGreaterThan(0);
    for (const event of returned) {
      expect(cache.some((cached) => cached === event)).toBe(false);
    }
  });

  it("돌려받은 것을 고쳐도 캐시가 안 바뀐다", async () => {
    const id = cachedIds()[0];
    const before = getMockEvents().find((event) => event.id === id)?.popularity;

    const detail = await mockEventApi.getDetail(id);
    detail.isLiked = !detail.isLiked;
    detail.popularity = -1;

    const cached = getMockEvents().find((event) => event.id === id);

    expect(cached?.popularity).toBe(before);
    expect(cached?.isLiked).not.toBe(detail.isLiked);
  });
});
