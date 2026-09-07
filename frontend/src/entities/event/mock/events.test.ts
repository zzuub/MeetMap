import { describe, expect, it, vi } from "vitest";
import { applyFilters, mockEventApi } from "../api/eventApi.mock";
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

describe("캐시 오염 방지", () => {
  /**
   * `getDetail` 은 캐시가 들고 있는 객체 하나를 화면에 넘기는 유일한 자리다.
   * 그대로 넘기면 화면의 필드 대입 한 줄이 같은 주의 모든 요청에 남는다 —
   * 타입(`Readonly<EventDetail>`)은 목 내부만 막고 포트 밖에서는 지워진다
   * (`decisions.md` 4.31 / PR #27 4차 리뷰).
   */
  it("getDetail 이 돌려준 것을 고쳐도 캐시가 안 바뀐다", async () => {
    const id = getMockEvents()[0].id;

    const detail = await mockEventApi.getDetail(id);
    detail.isLiked = !detail.isLiked;
    detail.popularity = -1;

    const cached = getMockEvents().find((event) => event.id === id);

    expect(cached?.isLiked).not.toBe(detail.isLiked);
    expect(cached?.popularity).not.toBe(-1);
  });
});
