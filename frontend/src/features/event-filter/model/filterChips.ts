import { scaleLabel, type EventListQuery } from "@/entities/event";
import { PRICE_CAPS, WHEN_OPTIONS } from "@/shared/config";
import { exploreHref, type ExploreParams } from "./exploreParams";

/**
 * 적용 필터 칩 줄 (6.2) + 필터 시트의 초기화·개수 (6.4).
 *
 * 홈에서 `전체보기 >` 로 들어오면 프리셋이 걸린 채로 도착한다(5-8). 그 조건이
 * 화면에 안 보이면 **결과가 왜 적은지 알 수 없고 풀 수도 없다** — 필터가 없는 것보다
 * 나쁘다. 이 모듈이 "무엇이 걸려 있나"와 "어떻게 푸나"를 한곳에서 답한다.
 *
 * ⚠️ **주소를 손으로 만들지 않는다.** 해제는 값을 바꿔 `exploreHref` 를 거친다 —
 * `URLSearchParams.delete("eligibleOnly")` 로 짜면 파라미터가 사라져 기본값(ON)으로
 * 되살아난다 (`decisions.md` 4.25).
 */

/** 자격 칩. `참가 불가` 계열 문구를 쓰지 않는 이유는 6.4 */
export const ELIGIBILITY_CHIP_LABEL = "내 나이대";

/**
 * 인증 주체가 필요한 축이 이 조건에 실려 있는가 (6.1).
 *
 * 파싱이 게스트에게 `eligibleOnly`·`maxPrice` 를 **아예 만들지 않으므로** 그 키의
 * 유무가 곧 게스트 여부다. 화면이 세션을 다시 보지 않게 하려고 이 함수를 둔다 —
 * 게이트가 두 곳이 되면 언젠가 한쪽만 고쳐진다.
 *
 * `eligibleOnly` 로 판정한다. 로그인 사용자에게는 **항상 boolean** 이기 때문이다
 * (부재 = 기본 ON). `maxPrice` 는 상한 미설정도 `undefined` 라 게스트와 구분되지 않는다.
 */
export function hasViewerAxes({ query }: ExploreParams): boolean {
  return query.eligibleOnly !== undefined;
}

export interface AppliedFilterChip {
  key: string;
  label: string;
  /** `"{조건명} 필터 해제"` (6.2 접근성) */
  removeLabel: string;
  /** 이 조건만 뺀 주소 */
  href: string;
}

/**
 * 칩 하나의 정의.
 *
 * `clear` 가 **현재 값을 받아 다음 값을 돌려주는 함수**인 것이 핵심이다. 분위기처럼
 * 여러 칩이 한 축을 나눠 쓰면 미리 계산한 결과를 겹쳐 쓰는 순간 마지막 하나만 남는다.
 * 이 형태라야 `초기화` 가 칩들을 차례로 접어 나갈 수 있다.
 */
interface ChipSpec {
  key: string;
  label: string;
  clear: (params: ExploreParams) => ExploreParams;
}

/**
 * 표시 대상은 **일정 · 자격 · 규모 · 가격 · 분위기 · 모집 상태**다 (6.2).
 *
 * 지역·시간대·정렬은 뺀다 — 앞의 둘은 상단 컨트롤이 이미 선택 상태를 보여주고,
 * 정렬은 필터가 아니다.
 *
 * **게스트 분기가 여기 없는 것은 의도다.** 파싱이 게스트에게 `eligibleOnly`·
 * `maxPrice` 키 자체를 만들지 않으므로(6.1) 두 칩은 저절로 빠진다. 여기서 한 번 더
 * 판정하면 게이트가 두 곳이 되고, 언젠가 한쪽만 고쳐진다.
 */
function chipSpecs({ query }: ExploreParams): ChipSpec[] {
  const specs: ChipSpec[] = [];

  if (query.when && query.when !== "ALL") {
    specs.push({
      key: "when",
      label: labelOf(WHEN_OPTIONS, query.when),
      clear: (params) => patched(params, { when: "ALL" }),
    });
  }

  // 이 칩이 떠 있는 것 자체가 "지금 네 출생연도로 걸러진 결과를 보고 있다"는 고지다
  if (query.eligibleOnly === true) {
    specs.push({
      key: "eligibleOnly",
      label: ELIGIBILITY_CHIP_LABEL,
      // 지우지 않고 `false` 로 둔다 — 지우면 기본값 ON 으로 되살아난다 (4.25)
      clear: (params) => patched(params, { eligibleOnly: false }),
    });
  }

  if (query.scale && query.scale !== "ALL") {
    specs.push({
      key: "scale",
      label: scaleLabel(query.scale),
      clear: (params) => patched(params, { scale: "ALL" }),
    });
  }

  if (query.maxPrice !== undefined) {
    specs.push({
      key: "maxPrice",
      label: `${priceCapLabel(query.maxPrice)} 이하`,
      clear: (params) => patched(params, { maxPrice: undefined }),
    });
  }

  // 분위기는 선택한 태그마다 개별 칩이다 (6.2)
  for (const tag of query.mood ?? []) {
    specs.push({
      key: `mood:${tag}`,
      label: tag,
      clear: (params) => patched(params, { mood: without(params.query.mood, tag) }),
    });
  }

  if (query.status === "OPEN") {
    specs.push({
      key: "status",
      label: "신청 가능만",
      clear: (params) => patched(params, { status: "ALL" }),
    });
  }

  return specs;
}

export function appliedFilterChips(params: ExploreParams): AppliedFilterChip[] {
  return chipSpecs(params).map(({ key, label, clear }) => ({
    key,
    label,
    removeLabel: `${label} 필터 해제`,
    href: exploreHref(clear(params)),
  }));
}

/**
 * 칩 줄의 `초기화` — **화면에 떠 있는 칩을 전부** 없앤다 (6.2).
 * 시간대·지역·정렬은 그대로 둔다.
 *
 * ⚠️ 시트의 `초기화`(`resetSheetFilters`)와 **대상이 다르다.** 이쪽은 자격까지 끄고
 * 시간대를 남기고, 저쪽은 자격을 남기고 시간대를 되돌린다 (`decisions.md` 4.26).
 */
export function clearAppliedFilters(params: ExploreParams): ExploreParams {
  return chipSpecs(params).reduce((acc, spec) => spec.clear(acc), params);
}

/**
 * 시트의 `초기화` — **2·3층만** 기본값으로 (6.4).
 *
 * 1층 자격 토글은 대상이 아니다. 개인 조건이지 필터가 아니라서, 초기화가 이걸 같이
 * 끄면 넓혀 보기를 의도하지 않은 사용자에게 자격 밖 회차가 조용히 섞인다.
 */
export function resetSheetFilters(params: ExploreParams): ExploreParams {
  return patched(params, {
    when: "ALL",
    slot: "ALL",
    scale: "ALL",
    mood: undefined,
    maxPrice: undefined,
    status: "ALL",
  });
}

/**
 * 활성 필터 개수 (6.2).
 *
 * **지역과 자격 토글은 세지 않는다** — 둘 다 별도 UI 로 항상 노출되므로 이중으로
 * 세면 배지가 거짓말이 된다. 시간대도 상단 칩이 그 자리를 대신한다.
 */
export function activeFilterCount({ query }: ExploreParams): number {
  return (
    (query.mood?.length ?? 0) +
    (query.when && query.when !== "ALL" ? 1 : 0) +
    (query.scale && query.scale !== "ALL" ? 1 : 0) +
    (query.maxPrice !== undefined ? 1 : 0) +
    (query.status === "OPEN" ? 1 : 0)
  );
}

/**
 * 필터 버튼 라벨 (6.2). **칩 줄이 떠 있으면 개수를 붙이지 않는다** — 조건이 이미
 * 칩으로 보이므로 같은 정보의 중복이다.
 *
 * 칩 줄을 상시 렌더하는 지금은 `필터 · N` 가지가 실제로 나오지 않는다(개수에 세는
 * 조건은 전부 칩을 만든다). 규칙을 남겨 두는 것은 칩 줄을 접는 변형이 생겼을 때
 * 이 분기가 되살아나야 하기 때문이다.
 */
export function filterButtonLabel(params: ExploreParams): string {
  if (appliedFilterChips(params).length > 0) return "필터";

  const count = activeFilterCount(params);
  return count === 0 ? "필터" : `필터 · ${count}`;
}

/* ── 내부 ───────────────────────────────────────────────── */

/**
 * 조건을 바꾼 새 `ExploreParams`. **`undefined` 를 넘긴 키는 지운다.**
 *
 * `{ ...query, maxPrice: undefined }` 는 키를 만들어 버린다. 게스트에게 없어야 할
 * 축이 그렇게 생기면 6.1 의 게스트 게이트가 무의미해지고, 왕복 비교도 어긋난다.
 */
function patched(params: ExploreParams, patch: Partial<EventListQuery>): ExploreParams {
  const query: EventListQuery = { ...params.query, ...patch };

  for (const key of Object.keys(patch) as (keyof EventListQuery)[]) {
    if (patch[key] === undefined) delete query[key];
  }

  return { ...params, query };
}

/** 마지막 태그를 빼면 축 자체를 없앤다 — 빈 배열은 "선택 없음"과 같은 뜻이다 */
function without(mood: string[] | undefined, tag: string): string[] | undefined {
  const rest = (mood ?? []).filter((item) => item !== tag);
  return rest.length > 0 ? rest : undefined;
}

function labelOf<T extends string>(
  options: readonly { code: T; label: string }[],
  code: T,
): string {
  return options.find((option) => option.code === code)?.label ?? code;
}

function priceCapLabel(value: number): string {
  return PRICE_CAPS.find((cap) => cap.value === value)?.label ?? `${value}원`;
}
