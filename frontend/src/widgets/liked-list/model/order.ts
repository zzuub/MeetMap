import { isPastDayKst, type EventSummary } from "@/entities/event";

type Dated = Pick<EventSummary, "id" | "date">;

/**
 * 찜 목록의 순서 (9장 · `decisions.md` 4.65) — 다가오는 회차를 가까운 순으로 먼저,
 * 지난 회차(KST 날짜 기준)는 최근 것부터 뒤에. 비교는 문자열이 아니라 시각이다.
 */
export function orderLikedEvents<T extends Dated>(events: readonly T[], now: Date): T[] {
  const upcoming = events.filter((event) => !isPastDayKst(event.date, now));
  const past = events.filter((event) => isPastDayKst(event.date, now));

  return [...upcoming.sort(byDate(1)), ...past.sort(byDate(-1))];
}

/** `1` 이면 오름차순. 같은 시각이면 id 로 고정한다 — 새로고침마다 흔들리지 않게 */
function byDate(direction: 1 | -1) {
  return (a: Dated, b: Dated) =>
    direction * (Date.parse(a.date) - Date.parse(b.date)) || a.id.localeCompare(b.id);
}
