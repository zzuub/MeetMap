import type { ReactNode } from "react";
import type { EventSummary, ViewerGender } from "../../model/types";

/** 카드 변형 5종 (14.1). 근거·표시 항목은 `decisions.md` 4.16 */
export type EventCardVariant = "feature" | "ratio" | "compact" | "list" | "sheet";

/**
 * 가격·자격의 기준이 되는 주체. 게스트는 `null` 이다.
 * `entities/user` 를 참조하지 않으려고 필요한 두 값만 받는다 (FSD 동일 레이어 금지).
 */
export interface EventCardViewer {
  gender: ViewerGender;
  birthYear: number;
}

export interface EventCardProps {
  event: EventSummary;
  variant?: EventCardVariant;
  viewer?: EventCardViewer | null;
  /**
   * 찜·신청 버튼이 놓이는 자리. `entities` 는 `features` 를 모르므로 상위
   * 레이어가 채운다. 놓이는 위치는 각 레이아웃이 정한다.
   */
  action?: ReactNode;
  /** 기본값 `/events/{id}` */
  href?: string;
  className?: string;
}

/** 레이아웃 컴포넌트가 받는 형태. `href` 는 기본값이 채워진 뒤라 필수다 */
export interface EventCardLayoutProps {
  event: EventSummary;
  viewer: EventCardViewer | null;
  action?: ReactNode;
  href: string;
  className?: string;
}
