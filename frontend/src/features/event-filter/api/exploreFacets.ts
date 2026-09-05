import type { CursorPage } from "@/shared/api";
import { eventApi, type EventListQuery, type TimeSlot } from "@/entities/event";
import { TIME_SLOTS, type DistrictCode } from "@/shared/config";

/**
 * 축별 결과 건수 — 시간대 칩(6.2)과 지역 시트(6.3)가 함께 쓴다.
 *
 * 둘 다 **건수가 0인 값을 아예 노출하지 않는다.** 항상 빈 결과만 내놓는 칩·항목은
 * 노이즈이고, 지역 시트는 건수(`N곳`)를 직접 그리기까지 한다.
 *
 * ⚠️ **임시 구현이다.** 목록 응답에 패싯(faceted) 카운트가 없어서 **조건에 맞는 건을
 * 긁어와 클라이언트에서 버킷팅**한다. 실 API 에 `facets` 가 생기면 이 파일만 바뀐다 —
 * 호출부는 `exploreFacets` 하나만 본다 (`progress.md` 5장).
 */

/**
 * 세지 못했으면 `null` — 화면은 전부 노출하고 건수를 감춘다 (`SCAN_LIMIT` 참조).
 *
 * ⚠️ **두 축은 따로 죽는다.** 각 축의 스캔 크기는 *자기 축만 지운* 조건의 건수라,
 * 구를 좁혀도 지역 스캔은 좁아지지 않는다 — 카탈로그가 커지면 **지역이 먼저**
 * `null` 이 된다(시간대를 고른 상태라면 반대). 한쪽만 `null` 인 상태가 정상이다.
 */
export interface ExploreFacets {
  slot: Record<TimeSlot, number> | null;
  /** 건수 0인 구는 키가 없다 — 읽는 쪽이 `?? 0` 으로 받는다 */
  district: Partial<Record<DistrictCode, number>> | null;
}

/**
 * 한 번에 긁어오는 상한.
 *
 * 넘으면 **버킷이 조용히 실제보다 작아진다** — 있는 구가 목록에서 빠지고 `N곳` 이
 * 거짓말을 한다. 그래서 넘친 축은 `null` 로 돌려 화면이 건수를 포기하게 한다.
 * 침묵하는 오답보다 "못 셌다"가 낫다.
 *
 * MVP1 은 서울 단일 도시라 이 값에 닿을 일이 없다. 닿는 시점이 곧 서버 패싯이
 * 필요해지는 시점이다.
 */
export const SCAN_LIMIT = 300;

export async function exploreFacets(query: EventListQuery): Promise<ExploreFacets> {
  const { slot, district } = facetQueries(query);

  const [slotItems, districtItems] = await Promise.all([
    scan("시간대", slot),
    scan("지역", district),
  ]);

  return {
    slot: slotItems === null ? null : countSlots(slotItems),
    district: districtItems === null ? null : countDistricts(districtItems),
  };
}

/* ── 순수 부분 (테스트가 직접 부른다) ────────────────────── */

/**
 * 축마다 **자기 축만 풀고 나머지 조건은 그대로 둔다.** 그래서 스캔이 둘이다.
 *
 * 한 번만 긁어 둘 다 만들면 축이 서로를 못 본다 — `district=MAPO` 인데 시간대 건수를
 * 전지역으로 세면 `오전` 칩이 떠 있는데 눌러서 0건이 나온다. 반대도 같다. 두 축 다
 * **자기 값을 고르기 전**의 조건에서 세야 맞다.
 *
 * 자기 축을 안 풀면 더 나쁘다 — 고른 값 말고는 전부 0이 되어 목록이 한 줄로 줄어든다.
 */
export function facetQueries(query: EventListQuery): {
  slot: EventListQuery;
  district: EventListQuery;
} {
  return {
    slot: { ...query, slot: "ALL" },
    district: { ...query, district: "ALL" },
  };
}

/** 상한을 넘겨 전부 못 받았으면 `null`. **부분 집계는 돌려주지 않는다** */
export function itemsOrNull<T>(page: CursorPage<T>): T[] | null {
  return page.totalCount > page.items.length ? null : page.items;
}

export function countSlots(
  items: readonly { timeSlot: TimeSlot }[],
): Record<TimeSlot, number> {
  const counts = Object.fromEntries(SLOTS.map((slot) => [slot, 0])) as Record<
    TimeSlot,
    number
  >;

  for (const item of items) counts[item.timeSlot] += 1;
  return counts;
}

export function countDistricts(
  items: readonly { district: DistrictCode }[],
): Partial<Record<DistrictCode, number>> {
  const counts: Partial<Record<DistrictCode, number>> = {};

  for (const item of items) counts[item.district] = (counts[item.district] ?? 0) + 1;
  return counts;
}

/* ── 내부 ───────────────────────────────────────────────── */

const SLOTS = TIME_SLOTS.map((slot) => slot.code).filter(
  (code): code is TimeSlot => code !== "ALL",
);

/**
 * **축 이름을 받는 이유**: 두 축은 서로 다른 조건에서 **서로 다른 시점에** 상한을
 * 넘긴다(자기 축을 지운 쿼리로 세므로). 축을 안 적으면 로그를 보는 사람이 "지역
 * 건수가 죽었다"와 "시간대 건수가 죽었다"를 구분할 수 없다 (PR #25 2차 리뷰).
 */
async function scan(axis: "시간대" | "지역", query: EventListQuery) {
  const page = await eventApi.getList({ ...query, cursor: null, limit: SCAN_LIMIT });
  const items = itemsOrNull(page);

  // 상한을 넘긴 것이 **서버 패싯으로 갈아탈 시점을 알려주는 유일한 신호**다 (4.28).
  // 남기지 않으면 건수가 조용히 사라진 것을 사용자 문의로 알게 된다 — 화면은
  // 고장 나지 않고 "전부 노출 + 건수 없음"으로 굳을 뿐이라 눈에 띄지 않는다.
  if (items === null) {
    console.warn(
      `[explore] ${axis} 패싯 스캔이 상한을 넘겨 건수를 표시하지 않습니다 — ` +
        `${page.totalCount}건 / 상한 ${SCAN_LIMIT}. 서버 패싯 전환 시점입니다.`,
    );
  }

  return items;
}
