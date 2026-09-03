/** 근거: docs/spec/08-마이-알림-후기.md 10.4·10.5 · docs/spec/10-데이터모델.md */

export type Rating = 1 | 2 | 3 | 4 | 5;
export type ReviewTagCategory = "분위기" | "진행" | "장소";

export interface Review {
  id: string;
  /**
   * **작성 대상**은 회차다. 참여 인증이 회차 단위라 "어느 소개팅에 갔는지"가
   * 확인돼야 후기를 쓸 수 있다 (10.5).
   */
  eventId: string;
  /** 주최사 페이지의 후기 카드가 `날짜 · 소개팅명` 으로 어느 회차인지 밝힌다 (10.4) */
  eventTitle: string;
  /**
   * **집계 대상**은 주최사다. 평점은 주최사에 쌓인다 (7.4 / `decisions.md` 4.19).
   *
   * 회차에서 파생 가능한 값이지만 들고 다닌다 — 주최사 후기 목록
   * (`/providers/{id}/reviews`)이 회차를 거치지 않고 바로 걸러야 한다.
   */
  providerId: string;
  author: string;
  authorAvatarUrl: string | null;
  rating: Rating;
  /** 10~500자 (10.5) */
  body: string;
  tags: string[];
  tagCategories: ReviewTagCategory[];
  createdAt: string;
}

export interface ReviewSummary {
  average: number;
  total: number;
  /** 5~1점 분포. 막대 그래프의 최대값 기준 비율 계산에 쓴다 (10.4) */
  distribution: Record<Rating, number>;
  /** 참여자가 많이 남긴 태그 Top 5 (10.4) */
  topTags: { label: string; count: number; category: string }[];
}

/** 후기 작성 대상. 참여 인증이 완료된 건만 내려온다 (10.5) */
export interface ReviewDraftTarget {
  eventId: string;
  eventTitle: string;
  /** 이미지 사용 미동의 주최사는 `null` (7.2) */
  thumbnailUrl: string | null;
  /**
   * 주최사. 작성 화면이 `"작성한 후기는 주최사 소개 페이지에 공개됩니다."` 를
   * 고지해야 하므로(10.5) 이름과 함께 id 도 필요하다.
   */
  provider: { id: string; name: string };
  /** 참여일 */
  attendedAt: string;
}
