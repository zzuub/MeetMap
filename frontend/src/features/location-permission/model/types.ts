import type { ActionFailure } from "@/shared/ui";

/** 근거: docs/spec/03-온보딩-위치권한.md 4장 */

/**
 * 왜 지역을 직접 고르게 됐는가 (4.3).
 *
 * 4장은 상태를 셋(`asking`/`granted`/`denied`)으로 적었지만 **`denied` 로 떨어지는
 * 길은 셋**이다. 배너 문구가 갈리므로 사유를 값으로 들고 다닌다 — 브라우저가
 * 위치를 못 잡은 것을 `권한이 꺼져 있어요` 라고 하면 사용자가 끄지도 않은 것을
 * 켜러 간다 (`decisions.md` 4.55).
 */
export type DeniedReason = "PERMISSION" | "UNAVAILABLE" | "UNSUPPORTED";

export interface NearbyCounts {
  /** 그 지역의 모집 중인 회차 수 (4.2 `주변 소개팅 N건`). 목록 응답의 전체 건수다 */
  total: number;
  /**
   * 4.2 `오늘 저녁 N건 · 심야 N건` — KST 달력 기준 오늘.
   *
   * ⚠️ **`total` 과 달리 `null` 이 될 수 있다.** 전체 건수는 응답이 그대로 주지만
   * 시간대 쪼개기는 **항목을 긁어와야** 하고, 상한을 넘기면 조용히 실제보다 작아진다
   * — 그때는 줄을 그리지 않는다 (`decisions.md` 4.28 · `exploreFacets` 와 같은 규칙).
   */
  today: { dinner: number; lateNight: number } | null;
}

/**
 * `granted` 화면이 그리는 것 (4.2).
 *
 * `area` 와 `href` 를 따로 두는 이유는 레이어다 — **`features` 는 라우팅을 모른다.**
 * `/explore?area=…` 를 만드는 것은 `exploreHref` 이고 그건 같은 레이어의 다른
 * 슬라이스(`event-filter`)라 여기서 부를 수 없다. 그래서 `app` 이 만들어 넣는다.
 */
export interface NearbySummary {
  /** 역지오코딩 표시 문자열 (`서울 성동구 성수동`) */
  label: string;
  /** 지역 마스터로 되돌린 값. `null` 이면 서울 전체 기준이다 */
  area: string | null;
  counts: NearbyCounts;
  /** `주변 소개팅 보기` 목적지 */
  href: string;
}

/**
 * 좌표 → 요약. **서버 액션의 반환 타입**이다.
 *
 * 실패를 예외로 던지지 않고 값으로 돌려준다 — 이 실패는 화면을 갈아끼우는 자리가
 * 아니라 **누른 버튼 위에 한 줄**로 알리는 자리다 (`decisions.md` 4.46).
 */
export type LocationResolution =
  | { ok: true; summary: NearbySummary }
  | { ok: false; failure: ActionFailure };
