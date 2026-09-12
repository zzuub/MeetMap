import {
  EXPLORE_VIEWS,
  exploreHref,
  type ExploreParams,
  type ExploreView,
} from "./exploreParams";

/**
 * 뷰 토글 `리스트 / 지도` 의 선택지 (6.2 · `decisions.md` 4.29 → 4.71).
 *
 * 목적지를 여기서 만드는 이유는 `sortChoices` 와 같다 — **렌즈만 바꾸고 조건은 그대로다.**
 * `?view=` 만 갈아끼우면 `eligibleOnly=0` 이 떨어져 자격 필터가 되살아난다 (4.24·4.25).
 * 정렬도 따라간다 — 지도는 정렬을 그리지 않지만 리스트로 돌아오면 고른 순서가 남는다.
 */
export interface ViewChoice {
  value: ExploreView;
  label: string;
  /** 이 뷰로 바꾼 주소 */
  href: string;
  selected: boolean;
}

const VIEW_LABEL: Record<ExploreView, string> = {
  list: "리스트",
  map: "지도",
};

export function viewChoices(params: ExploreParams): ViewChoice[] {
  return EXPLORE_VIEWS.map((view) => ({
    value: view,
    label: VIEW_LABEL[view],
    href: exploreHref({ ...params, view }),
    selected: view === params.view,
  }));
}
