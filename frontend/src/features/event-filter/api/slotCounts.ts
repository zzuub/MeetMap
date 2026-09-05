import { eventApi, type EventListQuery, type TimeSlot } from "@/entities/event";
import { TIME_SLOTS } from "@/shared/config";

/**
 * 시간대별 결과 건수 (6.2).
 *
 * 상단 시간대 칩은 **건수가 0인 슬롯을 아예 그리지 않는다** — 항상 빈 결과만 내놓는
 * 칩은 노이즈다. `오전` 이 실제로 그런 슬롯이다.
 *
 * ⚠️ **임시 구현이다.** 목록 응답에 패싯(faceted) 카운트가 없어서 슬롯마다
 * `totalCount` 만 받아온다(`limit: 1`, 병렬). 조회 네 번은 낭비이므로 실 API 에
 * `facets.slot` 이 생기면 그 필드로 갈아탄다 — 호출부는 이 함수만 보므로 바뀌지 않는다.
 * 지역 시트(6.3)의 구별 `N곳` 도 같은 값이 필요하다 → `progress.md` 5장.
 */
export type SlotCounts = Record<TimeSlot, number>;

const SLOTS = TIME_SLOTS.map((slot) => slot.code).filter(
  (code): code is TimeSlot => code !== "ALL",
);

export async function countBySlot(query: EventListQuery): Promise<SlotCounts> {
  const counts = await Promise.all(
    SLOTS.map((slot) =>
      eventApi
        .getList({ ...query, slot, cursor: null, limit: 1 })
        .then((page) => page.totalCount),
    ),
  );

  return Object.fromEntries(SLOTS.map((slot, i) => [slot, counts[i]])) as SlotCounts;
}
