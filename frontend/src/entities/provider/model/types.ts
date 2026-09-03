/** 근거: docs/frontend-feature-spec.md 7.4 / 12장 */

/**
 * 주최사 — 이 도메인의 **반복 주체**다.
 *
 * 회차는 1회성이라 후기·평점이 회차에 붙으면 소비 시점에 늘 비어 있다. 그래서
 * 후기는 회차에 대해 쓰되 주최사에 쌓는다 (`progress.md` 4.19).
 */
export interface ProviderSummary {
  id: string;
  name: string;
  /** 한 줄 소개. 인스타 프로필의 bio 자리 */
  tagline: string;
  /**
   * 원본 인스타 계정. 새 탭으로 연다.
   * 외부 신청 이동(7.3)과 달리 확인 모달을 거치지 않는다 — 결제 행위가 아니다.
   */
  instagramUrl: string;

  /**
   * 표시용 원본 평균. 후기 `REVIEW_DISPLAY_MIN_COUNT` 건 미만이면 `null` 이고
   * 화면은 `후기 N건` 만 쓴다. 임계 적용은 서버가 한다 — 화면마다 다시 세면 어긋난다.
   */
  rating: number | null;
  reviewCount: number;

  /**
   * **정렬 전용** 베이지안 보정값 (6.2).
   *
   * ⚠️ 화면에 노출하지 않는다. `rating` 과 나란히 보이면 순위를 설명할 수 없다 (4.20).
   */
  ratingScore: number;
}

/**
 * 주최사 소개 페이지(7.4)가 받는 형태.
 *
 * ⚠️ 모집 중인 회차·후기 목록을 담지 않는다 — `entities/provider` 는
 * `entities/event`·`entities/review` 를 import 할 수 없다(FSD 동일 레이어 금지).
 * 셋은 `widgets/provider-profile` 이 각 포트로 가져와 조립한다.
 */
export interface ProviderDetail extends ProviderSummary {
  /** 한 줄 소개보다 긴 설명. 컨택 직후라 못 받은 주최사는 `null` */
  description: string | null;
  /** 등록 시점(운영자가 대신 등록한 날) */
  registeredAt: string;
}
