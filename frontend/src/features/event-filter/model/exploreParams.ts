import type { EventListQuery } from "@/entities/event";
import {
  AREAS,
  DEFAULT_PROVINCE,
  DEFAULT_SORT,
  MOOD_TAGS,
  PRICE_CAPS,
  SCALE_OPTIONS,
  SEOUL_DISTRICTS,
  SORT_OPTIONS,
  TIME_SLOTS,
  WHEN_OPTIONS,
  type DistrictCode,
} from "@/shared/config";

/**
 * URL 쿼리스트링 ↔ 조회 파라미터 (6.1).
 *
 * **URL 이 필터 상태의 원본이다** (2.4). 그래서 이 변환이 화면의 계약이고, 순수
 * 함수로 떼어 두어 DOM 없이 테스트한다.
 *
 * 알 수 없는 값은 **에러가 아니라 기본값으로 떨어뜨린다** — URL 은 사용자가 직접
 * 고칠 수 있고 공유도 되므로 오타 하나로 빈 화면을 주지 않는다 (6.1).
 */

/** Next 의 `searchParams` 가 주는 모양 그대로 받는다 */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** 리스트/지도는 같은 목록을 보는 두 방식이다 (6.2 뷰 토글) */
export type ExploreView = "list" | "map";

export interface ExploreParams {
  view: ExploreView;
  query: EventListQuery;
}

/**
 * 게스트에게는 **인증 주체가 필요한 축을 아예 만들지 않는다** (6.1).
 * 서버가 인증 주체로 해석하는 값(`eligibleOnly`·`maxPrice`)이라 게스트에게는
 * 의미가 없고, 파라미터를 손으로 붙여도 무시돼야 한다.
 */
export function parseExploreParams(
  params: RawSearchParams,
  { isGuest }: { isGuest: boolean },
): ExploreParams {
  const query: EventListQuery = {
    province: DEFAULT_PROVINCE,
    district: parseDistrict(first(params.district)),
    when: pick(first(params.when), WHEN_OPTIONS, "ALL"),
    slot: pick(first(params.slot), TIME_SLOTS, "ALL"),
    scale: pick(first(params.scale), SCALE_OPTIONS, "ALL"),
    status: first(params.status) === "OPEN" ? "OPEN" : "ALL",
    sort: pick(first(params.sort), SORT_OPTIONS, DEFAULT_SORT),
    mood: parseMood(first(params.mood)),
    area: parseArea(first(params.area)),
  };

  if (!isGuest) {
    query.eligibleOnly = parseEligibleOnly(first(params.eligibleOnly));
    query.maxPrice = parseMaxPrice(first(params.maxPrice));
  }

  return { view: first(params.view) === "map" ? "map" : "list", query };
}

/**
 * 조회 파라미터 → 쿼리스트링. **기본값은 싣지 않는다** — URL 이 공유·북마크되므로
 * 짧을수록 좋고, 무엇이 실제로 걸린 조건인지 눈으로 읽혀야 한다.
 *
 * `eligibleOnly` 만 예외다. 기본이 ON 이라 끄려면 `=0` 을 명시해야 한다 (6.1).
 */
export function serializeExploreParams({ view, query }: ExploreParams): string {
  const search = new URLSearchParams();

  if (view !== "list") search.set("view", view);
  if (query.district && query.district !== "ALL") search.set("district", query.district);
  if (query.when && query.when !== "ALL") search.set("when", query.when);
  if (query.slot && query.slot !== "ALL") search.set("slot", query.slot);
  if (query.scale && query.scale !== "ALL") search.set("scale", query.scale);
  if (query.status === "OPEN") search.set("status", "OPEN");
  if (query.sort && query.sort !== DEFAULT_SORT) search.set("sort", query.sort);
  if (query.mood?.length) search.set("mood", query.mood.join(","));
  if (query.area) search.set("area", query.area);
  if (query.maxPrice !== undefined) search.set("maxPrice", String(query.maxPrice));
  if (query.eligibleOnly === false) search.set("eligibleOnly", "0");

  return search.toString();
}

/**
 * 탐색 화면의 주소. **링크·라우팅은 전부 이 함수를 거친다** (6.1).
 *
 * `serializeExploreParams` 만 내보내면 호출부마다 `/explore?` 를 손으로 붙이게 되고,
 * 그러다 보면 `URLSearchParams` 를 직접 만지는 자리가 생긴다 — `eligibleOnly` 를
 * 지워 기본값(ON)으로 되살리는 경로가 바로 거기서 열린다 (`decisions.md` 4.25).
 */
export function exploreHref(params: ExploreParams): string {
  const search = serializeExploreParams(params);
  return search ? `${EXPLORE_PATH}?${search}` : EXPLORE_PATH;
}

export const EXPLORE_PATH = "/explore";

/* ── 내부 ───────────────────────────────────────────────── */

/** 같은 키가 두 번 오면(`?slot=a&slot=b`) 첫 값만 쓴다 */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** 마스터 배열에서 코드를 찾아 돌려준다. 못 찾으면 기본값 — 타입 단언을 쓰지 않는다 */
function pick<T extends string>(
  value: string | undefined,
  options: readonly { code: T }[],
  fallback: T,
): T {
  const found = options.find((option) => option.code === value);
  return found ? found.code : fallback;
}

function parseDistrict(value: string | undefined): DistrictCode | "ALL" {
  const found = SEOUL_DISTRICTS.find((district) => district.code === value);
  return found ? found.code : "ALL";
}

/**
 * 동 단위 지역 (프로필 선호 지역 축). **마스터에 있는 값만 통과시킨다.**
 *
 * 목록 필터가 `event.area !== query.area` 로 정확히 일치를 보므로, 마스터에 없는
 * 값을 그대로 흘리면 전건이 걸러져 **조용한 빈 화면**이 된다 — 6.1 이 금지하는 것이다.
 * `EventListQuery.area` 가 `string` 이라 타입도 이걸 잡아주지 않는다.
 */
function parseArea(value: string | undefined): string | undefined {
  return AREAS.find((area) => area === value);
}

/** 다중 선택은 콤마 구분이다. 마스터에 없는 태그는 버린다 */
function parseMood(value: string | undefined): string[] | undefined {
  if (!value) return undefined;

  const tags = value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => (MOOD_TAGS as readonly string[]).includes(tag));

  return tags.length > 0 ? [...new Set(tags)] : undefined;
}

/**
 * 3상태로 읽는다 (6.1). **부재 = 기본 ON** 이고 `=0` 만 명시적 OFF 다 — 기본이
 * ON 이라 "파라미터가 없다 = 꺼짐"으로 읽으면 기본값을 표현할 수 없다.
 * 게스트는 이 함수에 오지 않는다(축 자체를 만들지 않는다).
 */
function parseEligibleOnly(value: string | undefined): boolean {
  return value !== "0";
}

/** 칩에 있는 값만 받는다. 임의 숫자를 받으면 필터 시트가 아무것도 선택 못 한 상태가 된다 */
function parseMaxPrice(value: string | undefined): number | undefined {
  const cap = PRICE_CAPS.find((price) => String(price.value) === value);
  return cap?.value;
}
