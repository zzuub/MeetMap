import type { ReactNode } from "react";
import type { EventSummary, ViewerGender } from "../../model/types";

/**
 * 카드 변형 — 14.1 의 다섯 + 찜 목록 `liked` + 검색 결과 `search`. 근거·표시 항목은
 * `decisions.md` 4.16·4.63·4.67. 하나 늘면 `LAYOUTS`·`SHAPES` 가 컴파일 에러로 짝을 요구한다
 */
export type EventCardVariant =
  | "feature"
  | "ratio"
  | "compact"
  | "list"
  | "sheet"
  | "liked"
  | "search";

/**
 * 가격·자격의 기준이 되는 주체. 게스트는 `null` 이다.
 * `entities/user` 를 참조하지 않으려고 필요한 두 값만 받는다 (FSD 동일 레이어 금지).
 *
 * ⚠️ **P2-4(프로필 설정) 전까지 모든 화면이 `null` 을 넘긴다** — 목 세션에 출생연도·
 * 성별이 없어서다. 그래서 로그인 상태에서도 가격이 남·여 병기로 나온다. 프로필이
 * 생기면 `UserProfile` 을 **그대로** 넘기면 된다(구조적으로 이 타입을 만족한다).
 * 고칠 자리는 `viewer={null}` 로 전부 찾을 수 있다.
 */
export interface EventCardViewer {
  gender: ViewerGender;
  birthYear: number;
}

interface EventCardCommonProps {
  event: EventSummary;
  viewer?: EventCardViewer | null;
  /**
   * 찜·신청 버튼이 놓이는 자리. `entities` 는 `features` 를 모르므로 상위
   * 레이어가 채운다. 놓이는 위치는 각 레이아웃이 정한다.
   */
  action?: ReactNode;
  /** 기본값 `/events/{id}` */
  href?: string;
  /**
   * **이 목록에 걸려 있는 자격 필터.** 카드가 `내 나이대 아님` 을 붙일지 정하는
   * 데만 쓴다 (6.4 · `marksIneligible`).
   *
   * 값이 셋인 이유는 URL 계약과 같다 — `undefined`(축 없음·게스트) / `true`(켜짐,
   * 남은 건이 전부 자격을 만족하므로 표시하지 않는다) / `false`(꺼짐, 자격 밖이
   * 섞여 있으므로 표시한다).
   */
  eligibleOnly?: boolean;
  className?: string;
}

/**
 * **`search` 만 검색어를 받는다** — 제목 하이라이트(11.1). 다른 변형에 넘기면 타입 에러다.
 * 선택 prop 으로 두면 `list` 에 검색어를 넘겨 놓고 하이라이트가 안 되는 이유를 찾게 된다
 * — 다섯 변형이 조용히 버리는 prop 이 된다 (`decisions.md` 4.67).
 */
export type EventCardProps =
  | (EventCardCommonProps & {
      variant?: Exclude<EventCardVariant, "search">;
      keyword?: never;
    })
  | (EventCardCommonProps & {
      variant: "search";
      /** 이 결과를 만든 검색어(서버가 받은 `q`). 입력창의 글자가 아니다 */
      keyword: string;
    });

/** 레이아웃 컴포넌트가 받는 형태. `href` 는 기본값이 채워진 뒤라 필수다 */
export interface EventCardLayoutProps {
  event: EventSummary;
  viewer: EventCardViewer | null;
  action?: ReactNode;
  href: string;
  eligibleOnly?: boolean;
  /** `search` 만 받는다 — 나머지는 타입이 막는다(`EventCardProps`) */
  keyword?: string;
  className?: string;
}
