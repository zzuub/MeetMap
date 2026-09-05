import type { ReactNode } from "react";
import type { EventSummary, ViewerGender } from "../../model/types";

/** 카드 변형 5종 (14.1). 근거·표시 항목은 `decisions.md` 4.16 */
export type EventCardVariant = "feature" | "ratio" | "compact" | "list" | "sheet";

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
