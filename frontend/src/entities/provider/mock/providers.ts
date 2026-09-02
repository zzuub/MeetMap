import { applyDisplayThreshold, ratingScore } from "@/shared/lib";
import type { ProviderDetail } from "../model/types";

/**
 * 목 주최사 4곳.
 *
 * **주최사당 2 회차씩** 붙는다 (`entities/event/mock/events.ts` 8건). 회차마다
 * 주최사가 다르면 주최사 단위 집계가 의미를 갖지 못해 화면을 검증할 수 없다 —
 * 평점 요약도, `진행 중인 소개팅` 목록도 늘 1건짜리가 된다.
 *
 * 평점 경계를 일부러 섞어 두었다.
 *
 * | 경계 | 주최사 |
 * | --- | --- |
 * | 평점 표시(후기 5건 이상) | prv-001(47건) · prv-002(12건) |
 * | **표시 임계 미달**(5건 미만) | prv-003 — 후기 3건. 평균 4.67 인데 `rating` 이 `null` 이다 |
 * | **후기 0건** | prv-004 — 신규 입점. 정렬에서 맨 아래가 아니라 중간에 놓인다 |
 * | 이미지 사용 미동의 | prv-004 — 소속 회차 2건 모두 `thumbnailUrl: null` (7.2) |
 * | 모집 중인 회차 1건 | prv-001 — 회차 2건 중 하나가 `마감`(evt-007) |
 *
 * prv-003 이 특히 중요하다. 원본 평균 4.67 은 prv-001 의 4.6 보다 높지만
 * 보정값은 4.39 < 4.55 라 정렬에서 지지 않는다 — **표본 적은 고득점이 표본 많은
 * 고득점을 이기지 못한다**는 6.2 규칙이 이 데이터로 눈에 보인다.
 *
 * ⚠️ 인스타 URL 은 `example.com` 이다. 실제 계정을 가리키면 목 데이터가 남의
 * 계정으로 트래픽을 보낸다.
 */

interface MockProviderRecord {
  id: string;
  name: string;
  tagline: string;
  instagramUrl: string;
  description: string | null;
  registeredAt: string;
  /** 후기 원본 평균. 후기 0건이면 0 */
  ratingAverage: number;
  reviewCount: number;
}

const RECORDS: MockProviderRecord[] = [
  {
    id: "prv-001",
    name: "로테이션서울",
    tagline: "성수·한남에서 여는 30분 로테이션 소개팅",
    instagramUrl: "https://example.com/instagram/rotation_seoul",
    description:
      "2023년부터 서울 동부권에서 로테이션 소개팅을 진행하고 있습니다. 30분마다 자리를 바꿔 참가자 전원과 대화하는 방식이며, 매 회차 진행자가 상주합니다.",
    registeredAt: "2026-07-14T10:00:00+09:00",
    ratingAverage: 4.6,
    reviewCount: 47,
  },
  {
    id: "prv-002",
    name: "미팅라운지",
    tagline: "강남·홍대 대형 로테이션. 90년대생 위주",
    instagramUrl: "https://example.com/instagram/meeting_lounge",
    description:
      "20~30명 규모의 대형 로테이션을 주로 엽니다. 4인 테이블을 20분마다 재편성하고 중간에 자유 네트워킹 라운드를 둡니다.",
    registeredAt: "2026-07-28T14:00:00+09:00",
    ratingAverage: 4.2,
    reviewCount: 12,
  },
  {
    id: "prv-003",
    name: "테이블포텐",
    tagline: "10명 정원 다이닝 소개팅",
    instagramUrl: "https://example.com/instagram/table_for_ten",
    description:
      "한 테이블에서 코스마다 자리를 바꾸는 소수정예 방식입니다. 대화가 끊기지 않는 인원을 유지하는 것을 원칙으로 합니다.",
    registeredAt: "2026-08-20T09:30:00+09:00",
    // 후기 3건 · 평균 4.67 — 표시 임계 미달이라 rating 은 null 로 떨어진다
    ratingAverage: 4.67,
    reviewCount: 3,
  },
  {
    id: "prv-004",
    name: "첫만남클럽",
    tagline: "사회초년생을 위한 부담 없는 첫 소개팅",
    instagramUrl: "https://example.com/instagram/first_meeting_club",
    // 컨택 직후라 소개 본문을 아직 받지 못했다
    description: null,
    registeredAt: "2026-08-30T16:40:00+09:00",
    // 이번 달에 등록한 신규 주최사. 후기가 아직 없다
    ratingAverage: 0,
    reviewCount: 0,
  },
];

/**
 * 서버가 할 일을 흉내낸다 — 원본 평균·건수에서 **표시용 평점**과 **정렬용
 * 보정값**을 산출한다. 목 데이터에 계산 결과를 박아두면 상수(`C`·`m`)를 고쳤을 때
 * 조용히 어긋난다.
 */
export const MOCK_PROVIDERS: ProviderDetail[] = RECORDS.map((record) => ({
  id: record.id,
  name: record.name,
  tagline: record.tagline,
  instagramUrl: record.instagramUrl,
  description: record.description,
  registeredAt: record.registeredAt,
  rating: applyDisplayThreshold(record.ratingAverage, record.reviewCount),
  reviewCount: record.reviewCount,
  ratingScore: ratingScore(record.ratingAverage * record.reviewCount, record.reviewCount),
}));

/** `id → ProviderDetail`. 목 이벤트가 주최사를 참조할 때 쓴다 */
export const MOCK_PROVIDER_BY_ID: Record<string, ProviderDetail> =
  Object.fromEntries(MOCK_PROVIDERS.map((provider) => [provider.id, provider]));
