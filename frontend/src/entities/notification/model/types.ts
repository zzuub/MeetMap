/** 근거: docs/frontend-feature-spec.md 10.2 / 12장 */

export type NotificationKind = "urgent" | "new" | "review" | "info";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** '마감임박' | '신규' | '후기' | '안내' */
  tag: string;
  title: string;
  body: string;
  /** ISO — 화면에는 상대 시간으로 표기한다 (formatRelativeTime) */
  createdAt: string;
  isRead: boolean;
  /** 딥링크. 마감임박→행사 상세, 신규→탐색, 후기→후기 작성 (10.2) */
  linkUrl: string;
}

export const NOTIFICATION_TAG: Record<NotificationKind, string> = {
  urgent: "마감임박",
  new: "신규",
  review: "후기",
  info: "안내",
};
