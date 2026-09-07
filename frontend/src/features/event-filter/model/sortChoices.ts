import { SORT_OPTIONS, VIEWER_SORTS } from "@/shared/config";
import type { SortOption } from "@/entities/event";
import { exploreHref, type ExploreParams } from "./exploreParams";
import { hasViewerAxes } from "./filterChips";

/**
 * 정렬 `select` 의 선택지 (6.2) — 인기순(기본) / 최신순 / 평점 높은순 /
 * 가격 낮은순 / 가격 높은순.
 *
 * 목적지를 여기서 만드는 이유는 칩 줄(`filterChips`)과 같다. **주소를 손으로 만들지
 * 않는다** — 값을 바꿔 `exploreHref` 를 거친다 (`decisions.md` 4.24·4.25). 화면에
 * 두면 `?sort=` 만 갈아끼우는 코드가 생기고, 그 순간 `eligibleOnly=0` 이 떨어져
 * 자격 필터가 기본값(ON)으로 되살아난다.
 *
 * ⚠️ **정렬은 결과 집합을 바꾸지 않는다.** 그래서 축별 건수 규칙(4.28) 밖이고,
 * 이 축 때문에 패싯 스캔이 늘지 않는다.
 */
export interface SortChoice {
  code: SortOption;
  label: string;
  /** 이 정렬로 바꾼 주소 */
  href: string;
  selected: boolean;
}

/**
 * **게스트에게는 가격 정렬을 숨긴다** (6.2). 평점 정렬은 숨기지 않는다 — 주최사
 * `ratingScore` 기준이라 인증 주체가 필요 없다 (4.20).
 *
 * 게스트 판정은 세션이 아니라 **인증 축의 유무**다 (`hasViewerAxes` / 4.27).
 * 게이트가 두 곳이 되면 언젠가 한쪽만 고쳐진다.
 *
 * 숨기는 것과 별개로 값 자체는 파싱이 막는다 — 손으로 붙인 `?sort=priceAsc` 는
 * 게스트에게 `popular` 로 떨어지므로 여기서 `selected` 가 하나도 없는 목록이
 * 나오지 않는다 (4.30).
 */
export function sortChoices(params: ExploreParams): SortChoice[] {
  const guest = !hasViewerAxes(params);
  const current = params.query.sort;

  return SORT_OPTIONS.filter(
    (option) => !guest || !(VIEWER_SORTS as readonly string[]).includes(option.code),
  ).map((option) => ({
    code: option.code,
    label: option.label,
    href: exploreHref({ ...params, query: { ...params.query, sort: option.code } }),
    selected: option.code === current,
  }));
}
