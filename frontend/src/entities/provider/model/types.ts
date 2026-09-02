/** 근거: docs/frontend-feature-spec.md 7.4 / 12장 (2026-09-02 평점 귀속 재정의) */

/**
 * 주최사.
 *
 * MeetMap 이 모으는 상품은 로테이션 소개팅 하나고, **반복 주체는 주최사**다.
 * 회차는 1회성이므로 후기·평점이 회차에 붙으면 소비 시점에 항상 비어 있다.
 * 배달 앱의 가게 리뷰와 같은 구조로, 후기는 회차에 대해 쓰지만 **주최사에 쌓인다**
 * (`progress.md` 4.19).
 */
export interface ProviderSummary {
  id: string;
  name: string;
  /** 한 줄 소개. 인스타 프로필의 bio 자리 (7.4) */
  tagline: string;
  /**
   * 원본 인스타 계정. 주최사 페이지에서 새 탭으로 연다.
   *
   * 외부 신청 이동(7.3)과 달리 **확인 모달을 거치지 않는다** — 신청·결제 행위가
   * 아니라 단순 참조 링크라 결제 비대행 고지의 대상이 아니다.
   */
  instagramUrl: string;

  /**
   * 표시용 원본 평균. 후기가 `REVIEW_DISPLAY_MIN_COUNT` 건 미만이면 **`null`** 이고
   * 화면은 `후기 N건` 만 쓴다.
   *
   * 임계 적용을 서버가 해서 내려보낸다 — 화면마다 5를 다시 세면 어긋난다.
   * 목 구현에서는 `applyDisplayThreshold` 가 그 역할을 한다.
   */
  rating: number | null;
  reviewCount: number;

  /**
   * **정렬 전용** 베이지안 보정값 (6.2 `sort=rating`).
   *
   * ⚠️ **화면에 절대 노출하지 않는다.** `rating`(원본 평균)과 나란히 보이면
   * "4.6인데 왜 4.5보다 아래냐"에 답할 수 없다. 정렬 순위와 표시 평점이 어긋나는
   * 것은 이 방식의 알려진 대가다 (`progress.md` 4.20).
   */
  ratingScore: number;
}

/**
 * 주최사 소개 페이지(7.4)가 받는 형태.
 *
 * ⚠️ **모집 중인 회차와 후기 목록을 여기 담지 않는다.** `entities/provider` 는
 * `entities/event`·`entities/review` 를 import 할 수 없다(FSD 동일 레이어 금지).
 * 세 조각은 상위 레이어(`widgets/provider-profile`)가 각 포트로 따로 가져와
 * 조립한다 — 회차는 `eventApi.getList({ providerId, status: 'OPEN' })`,
 * 후기는 `reviewApi` 다.
 */
export interface ProviderDetail extends ProviderSummary {
  /** 소개 본문. 한 줄 소개보다 긴 설명이 있는 주최사만 채운다 */
  description: string | null;
  /** 등록 시점 (운영자가 대신 등록한 날). 신규 입점 판단 축 */
  registeredAt: string;
}
