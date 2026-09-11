import { isPastDayKst } from "./derive";
import type { EventSummary } from "./types";

type Dated = Pick<EventSummary, "id" | "date">;

/**
 * 다가오는 회차를 가까운 순으로 먼저, 지난 회차(KST 날짜 기준)는 최근 것부터 뒤에.
 * 비교는 문자열이 아니라 시각이다 (`decisions.md` 4.65 · 4.70).
 *
 * 끝난 회차가 섞이는 목록의 규칙이다 — 찜 목록(9장)과 검색 결과(11.1)가 쓴다. 둘 다
 * **서버에서 한 번** 부른다. 클라이언트가 `new Date()` 를 다시 읽으면 KST 자정 무렵
 * 서버와 다른 순서를 그려 하이드레이션이 어긋난다.
 */
export function orderUpcomingFirst<T extends Dated>(events: readonly T[], now: Date): T[] {
  const upcoming = events.filter((event) => !isPastDayKst(event.date, now));
  const past = events.filter((event) => isPastDayKst(event.date, now));

  return [...upcoming.sort(byDate(1)), ...past.sort(byDate(-1))];
}

/** `1` 이면 오름차순. 같은 시각이면 id 로 고정한다 — 새로고침마다 흔들리지 않게 */
function byDate(direction: 1 | -1) {
  return (a: Dated, b: Dated) =>
    direction * (Date.parse(a.date) - Date.parse(b.date)) || a.id.localeCompare(b.id);
}
