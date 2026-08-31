/** 근거: docs/frontend-feature-spec.md 10.4 / 10.5 / 12장 */

export type Rating = 1 | 2 | 3 | 4 | 5;
export type ReviewTagCategory = "분위기" | "진행" | "장소";

export interface Review {
  id: string;
  eventId: string;
  eventTitle: string;
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
  thumbnailUrl: string;
  provider: string;
  /** 참여일 */
  attendedAt: string;
}
