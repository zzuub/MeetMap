import { describe, expect, it } from "vitest";
import { orderUpcomingFirst } from "./order";

/**
 * 끝난 회차가 섞이는 목록의 순서 — 찜 목록(9장)·검색 결과(11.1) (`decisions.md` 4.65·4.70).
 * P2-9 에서 `widgets/liked-list` 에서 옮겨 왔고 단언은 그대로다.
 *
 * **날짜 로직이다** — CI 가 `America/Los_Angeles`·`Pacific/Kiritimati` 로 한 번 더 돈다.
 * 아래 `KST 자정` 케이스가 로컬 달력을 읽는 구현을 세 TZ 모두에서 떨어뜨린다.
 */
const at = (id: string, date: string) => ({ id, date });
const ids = (events: readonly { id: string }[]) => events.map((event) => event.id);

describe("다가오는 순 → 지난 순", () => {
  // 2026-09-11(금) 21:00 KST
  const now = new Date("2026-09-11T21:00:00+09:00");
  const events = [
    at("지난주", "2026-09-05T19:00:00+09:00"),
    at("일요일", "2026-09-13T19:00:00+09:00"),
    at("어제", "2026-09-10T20:00:00+09:00"),
    at("오늘저녁", "2026-09-11T19:30:00+09:00"),
    at("토요일", "2026-09-12T11:00:00+09:00"),
  ];
  const expected = ["오늘저녁", "토요일", "일요일", "어제", "지난주"];

  it("다가오는 회차를 가까운 순으로 먼저, 지난 회차는 최근 것부터 뒤에 둔다", () => {
    expect(ids(orderUpcomingFirst(events, now))).toEqual(expected);
  });

  it("뒤집어 넣어도 같다 — 입력 순서의 안정 정렬로 통과하지 않는다", () => {
    expect(ids(orderUpcomingFirst([...events].reverse(), now))).toEqual(expected);
  });

  it("오늘 이미 시작한 회차는 지난 쪽이 아니다 — 시각이 아니라 날짜를 센다", () => {
    // `date < now` 로 가르는 구현이면 `오늘저녁` 이 `어제` 앞의 지난 묶음으로 간다
    expect(ids(orderUpcomingFirst(events, now))[0]).toBe("오늘저녁");
  });

  it("KST 자정 직후에는 어젯밤 회차가 지난 쪽으로 간다", () => {
    // now = 9/11 00:30 KST. `어젯밤`(9/10 23:00 KST)은 UTC·LA·+14 어느 로컬 달력으로
    // 읽어도 now 와 같은 날이라, 로컬 TZ 를 읽는 구현은 여기서 위로 올린다
    const justAfterMidnightKst = new Date("2026-09-10T15:30:00Z");
    const ordered = orderUpcomingFirst(
      [
        at("어젯밤", "2026-09-10T14:00:00Z"),
        at("모레", "2026-09-12T10:00:00Z"),
        at("새벽", "2026-09-10T16:00:00Z"),
      ],
      justAfterMidnightKst,
    );

    expect(ids(ordered)).toEqual(["새벽", "모레", "어젯밤"]);
  });

  it("`Z` 와 `+09:00` 이 섞여도 시각으로 비교한다", () => {
    // 문자열로 비교하면 `T02:00Z`(11:00 KST)가 `T10:00+09:00`(01:00Z)보다 앞선다
    const ordered = orderUpcomingFirst(
      [at("늦게", "2026-09-12T02:00:00Z"), at("일찍", "2026-09-12T10:00:00+09:00")],
      now,
    );

    expect(ids(ordered)).toEqual(["일찍", "늦게"]);
  });

  it("같은 시각이면 id 로 고정한다", () => {
    const same = "2026-09-12T19:00:00+09:00";

    expect(ids(orderUpcomingFirst([at("나", same), at("가", same)], now))).toEqual(["가", "나"]);
  });

  it("입력을 바꾸지 않는다", () => {
    const input = Object.freeze([...events]);

    orderUpcomingFirst(input, now);

    expect(ids(input)).toEqual(ids(events));
  });
});
