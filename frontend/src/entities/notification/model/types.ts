/** 근거: docs/spec/08-마이-알림-후기.md 10.2 · docs/spec/10-데이터모델.md */

export type NotificationKind = "new" | "review" | "info";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  /** '신규' | '후기' | '안내' */
  tag: string;
  title: string;
  body: string;
  /** ISO — 화면에는 상대 시간으로 표기한다 (formatRelativeTime) */
  createdAt: string;
  isRead: boolean;
  /** 딥링크. 신규→탐색, 후기→후기 작성, 안내→해당 설정 (10.2) */
  linkUrl: string;
}

export const NOTIFICATION_TAG: Record<NotificationKind, string> = {
  new: "신규",
  review: "후기",
  info: "안내",
};
