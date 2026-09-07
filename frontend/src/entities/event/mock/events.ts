import { applyDisplayThreshold, ratingScore } from "@/shared/lib";
import type { EventDetail } from "../model/types";
import { kstFromThisMonday } from "./dates";

/**
 * 목 소개팅 데이터 — **로테이션 소개팅** 8건.
 *
 * 백엔드가 스켈레톤뿐이라 Phase 1~3은 이 데이터 위에서 만든다.
 * 2026-09-01 도메인 재정의로 취미 모임(러닝 크루·쿠킹 클래스·전시 도슨트) 8건을
 * 전면 교체했다. MeetMap 이 모으는 상품은 로테이션 소개팅 하나다.
 *
 * 화면이 실제로 마주칠 **경계값을 일부러 섞어 두었다.** "행복한 데이터"만 넣으면
 * 빈 상태·경고 UI 가 개발 중에 한 번도 안 보인다.
 *
 * | 경계 | 건 |
 * | --- | --- |
 * | 가격 미확인(`null`) | evt-004 — 카드는 `링크 확인`, 비교함 `가성비` 후보 제외 |
 * | 이미지 미동의(`thumbnailUrl: null`) | evt-006 · evt-008 — **prv-004 의 회차 전부** (7.2) |
 * | `status: '마감'` | evt-007 — 그것도 인기 상위라 홈 첫 화면에 뜬다 |
 * | `locationPrecision` 3종 | EXACT(001·004·007) / STATION(002·005·008) / DISTRICT(003·006) |
 * | `scale` 3종 | SMALL(004·008) / STANDARD(001·005·006·007) / LARGE(002·003) |
 * | `timeSlot` 4종 | MORNING(005) / AFTERNOON(006) / DINNER(5건) / LATE_NIGHT(003) |
 * | 일정 | 이번 주 5건(월+4~월+6) / 그 이후 3건 — `when` 필터가 양쪽 다 결과를 낸다 |
 * | 가격 | `PRICE_CAPS` 3종(3만/5만/7만)이 남·여 어느 기준으로도 서로 다른 건수를 낸다 |
 *
 * ## 주최사는 4곳이고 **회차가 2건씩** 붙는다 (2026-09-02)
 *
 * | 주최사 | 회차 | 무엇을 검증하나 |
 * | --- | --- | --- |
 * | prv-001 로테이션서울 | 001 · 007 | **모집 중인 회차가 1건**이다 — 007 이 마감이라 주최사 페이지(7.4)가 마감 회차를 거르는지 |
 * | prv-002 미팅라운지 | 002 · 003 | 평점 표시 주최사(후기 12건) |
 * | prv-003 테이블포텐 | 004 · 005 | **표시 임계 미달**(후기 3건) — 평점 자리가 `후기 3건` 으로 떨어진다 |
 * | prv-004 첫만남클럽 | 006 · 008 | **후기 0건 + 이미지 사용 미동의** |
 *
 * 회차마다 주최사가 다르면 주최사 단위 집계를 화면에서 검증할 수 없다 — 평점
 * 요약도 `진행 중인 소개팅` 목록도 늘 1건짜리가 된다.
 *
 * ⚠️ **이미지 사용 동의는 회차가 아니라 주최사 단위다** (7.2 동의 범위). 그래서
 * prv-004 의 회차는 **둘 다** `thumbnailUrl: null` 이다. 한쪽만 비우면 같은
 * 주최사인데 어떤 회차는 사진이 있고 어떤 회차는 없는 모순이 된다.
 *
 * ⚠️ 주최사 이름을 여기 적어 두는 것은 중복이지만 **의도적**이다.
 * `entities/event` 는 `entities/provider` 를 import 할 수 없고(FSD 동일 레이어
 * 금지), 실제 서버도 목록 응답에 `{ id, name }` 을 embed 한다. 이름이 바뀌면
 * `entities/provider/mock/providers.ts` 와 함께 고친다.
 *
 * ## 날짜는 절대값이 아니라 **이번 주 월요일 기준 상대값**이다 (2026-09-07)
 *
 * 개최일은 `kstFromThisMonday(일수, 시각)` 이고 기준은 `isThisWeek` 가 보는 것과
 * **같은 `weekRangeKst`** 다. 그래서 위 표의 `이번 주 5건 / 그 이후 3건` 은 우연이
 * 아니라 구조로 보장된다 — 날짜를 손으로 갱신할 일이 없다.
 *
 * 전에는 절대 날짜에 "과거로 밀리면 갱신한다"는 메모가 붙어 있었고, 갱신하는
 * 사람이 없어 2026-09-07 에 실제로 목 API 테스트가 깨졌다 (`decisions.md` 4.31).
 *
 * ⚠️ **등록일(`createdAt`)의 일수는 전부 음수여야 한다.** 이번 주 월요일 이전이라야
 * 어느 요일에 돌려도 미래가 되지 않는다. 값끼리의 순서는 `sort=latest` 와
 * `정렬 축에 동률이 없다` 불변식이 지킨다.
 *
 * 정원은 전 건 남녀 모두 1 이상이다. 한쪽 정원이 0인 회차(추가 모집 등)는 실제로
 * 드물어 넣지 않았다 — `isEligible` 의 정원 검사는 유닛 테스트로 덮는다.
 *
 * **덮지 못한 경계 하나**: 모집 중인 회차가 0건인 주최사(전부 마감). 주최사
 * 페이지의 빈 상태(7.4)를 목으로 볼 수 없다. 9번째 회차를 넣으면 위 일정·가격
 * 건수가 흔들려서, P5-4 착수 때 같이 정한다.
 */

/**
 * 주최사 원본 수치.
 *
 * ⚠️ **`entities/provider/mock/providers.ts` 와 같은 값을 들고 있다. 함께 고친다.**
 * `entities/event` 는 `entities/provider` 를 import 할 수 없으므로(FSD 동일 레이어
 * 금지) 이 중복은 구조가 강제한 것이다. 실서버에서는 조인 한 번이면 될 일이다.
 * 어긋나면 목록 정렬(`sort=rating`)과 주최사 페이지의 평점이 서로 다른 답을 낸다.
 */
const PROVIDER_RATING: Record<string, { average: number; count: number }> = {
  "prv-001": { average: 4.6, count: 47 },
  "prv-002": { average: 4.2, count: 12 },
  // 평균 4.67 은 prv-001 보다 높지만 후기 3건이라 표시 임계에 미달한다
  "prv-003": { average: 4.67, count: 3 },
  "prv-004": { average: 0, count: 0 },
};

/**
 * `sort=rating` 의 정렬 키 (6.2).
 *
 * 원본 평균이 아니라 **베이지안 보정값**이다. 산식은 `shared/lib/rating.ts` 한
 * 곳에만 있고 주최사 슬라이스도 같은 함수를 쓴다 — 두 벌이면 목록과 주최사
 * 페이지의 순위가 어긋난다.
 */
export function mockProviderRatingScore(providerId: string): number {
  const found = PROVIDER_RATING[providerId];
  if (!found) return ratingScore(0, 0);
  return ratingScore(found.average * found.count, found.count);
}

/** 상세(7.1) 주최사 블록용. 목록에는 `{ id, name }` 만 실린다 */
const PROVIDER_DETAIL = {
  "prv-001": {
    id: "prv-001",
    name: "로테이션서울",
    tagline: "성수·한남에서 여는 30분 로테이션 소개팅",
    ...displayRating("prv-001"),
  },
  "prv-002": {
    id: "prv-002",
    name: "미팅라운지",
    tagline: "강남·홍대 대형 로테이션. 90년대생 위주",
    ...displayRating("prv-002"),
  },
  "prv-003": {
    id: "prv-003",
    name: "테이블포텐",
    tagline: "10명 정원 다이닝 소개팅",
    ...displayRating("prv-003"),
  },
  "prv-004": {
    id: "prv-004",
    name: "첫만남클럽",
    tagline: "사회초년생을 위한 부담 없는 첫 소개팅",
    ...displayRating("prv-004"),
  },
} as const;

/** 표시 임계(5건)를 적용한 평점. 미달이면 `null` 이고 화면은 `후기 N건` 만 쓴다 */
function displayRating(providerId: string): {
  rating: number | null;
  reviewCount: number;
} {
  const { average, count } = PROVIDER_RATING[providerId];
  return { rating: applyDisplayThreshold(average, count), reviewCount: count };
}

const BASE = {
  province: "SEOUL",
  /** 위치 권한 없는 상태가 기본이다. 허용 시 서버가 채워 내린다 (8장) */
  distanceKm: null,
} as const;

export const MOCK_EVENTS: EventDetail[] = [
  {
    ...BASE,
    id: "evt-001",
    title: "성수 루프탑 로테이션 소개팅 7:7",
    shortTitle: "성수 루프탑",
    provider: PROVIDER_DETAIL["prv-001"],
    thumbnailUrl: "/mock/event-seongsu.jpg",
    images: ["/mock/event-seongsu.jpg"],
    date: kstFromThisMonday(4, "19:30"),
    dateLabel: "9/4(금)",
    timeLabel: "19:30",
    timeSlot: "DINNER",
    birthYearFrom: 1990,
    birthYearTo: 1996,
    maleCapacity: 7,
    femaleCapacity: 7,
    scale: "STANDARD",
    malePrice: 45000,
    femalePrice: 35000,
    status: "신청 가능",
    jobGroups: ["대기업", "전문직", "외국계"],
    mood: ["트렌디한", "고급스러운"],
    area: "성수·건대",
    district: "SEONGDONG",
    locationPrecision: "EXACT",
    stationName: null,
    lat: 37.5445,
    lng: 127.0557,
    popularity: 980,
    createdAt: kstFromThisMonday(-13, "10:00"),
    isLiked: false,
    description:
      "30분마다 자리를 바꾸는 로테이션 방식으로 참가자 전원과 대화합니다. 웰컴 드링크 1잔이 포함되어 있고, 마지막 라운드 후 자유 시간이 있습니다.",
    venueName: "루프탑 바 노이",
    address: "서울 성동구 성수동2가 299-50",
    externalApplyUrl: "https://example.com/apply/evt-001",
    attendeeListUrl: null,
  },
  {
    ...BASE,
    id: "evt-002",
    title: "강남 90년대생 로테이션 소개팅 15:15",
    shortTitle: "강남 90s",
    provider: PROVIDER_DETAIL["prv-002"],
    thumbnailUrl: "/mock/event-gangnam.jpg",
    images: ["/mock/event-gangnam.jpg"],
    date: kstFromThisMonday(5, "19:00"),
    dateLabel: "9/5(토)",
    timeLabel: "19:00",
    timeSlot: "DINNER",
    birthYearFrom: 1990,
    birthYearTo: 1999,
    maleCapacity: 15,
    femaleCapacity: 15,
    scale: "LARGE",
    malePrice: 55000,
    femalePrice: 39000,
    status: "신청 가능",
    jobGroups: ["대기업", "공기업", "중견기업"],
    mood: ["네트워킹", "트렌디한"],
    area: "강남·역삼",
    district: "GANGNAM",
    locationPrecision: "STATION",
    stationName: "강남역",
    lat: 37.4979,
    lng: 127.0276,
    popularity: 1120,
    createdAt: kstFromThisMonday(-16, "14:00"),
    isLiked: true,
    description:
      "30명 규모의 대형 로테이션 소개팅입니다. 4인 테이블을 20분마다 재편성하며, 중간에 자유 네트워킹 라운드가 두 번 있습니다.",
    venueName: null,
    address: null,
    externalApplyUrl: "https://example.com/apply/evt-002",
    attendeeListUrl: null,
  },
  {
    ...BASE,
    id: "evt-003",
    title: "홍대 심야 로테이션 소개팅",
    shortTitle: "홍대 심야",
    provider: PROVIDER_DETAIL["prv-002"],
    thumbnailUrl: "/mock/event-hongdae.jpg",
    images: ["/mock/event-hongdae.jpg"],
    date: kstFromThisMonday(5, "22:00"),
    dateLabel: "9/5(토)",
    timeLabel: "22:00",
    timeSlot: "LATE_NIGHT",
    birthYearFrom: 1993,
    birthYearTo: 2000,
    maleCapacity: 10,
    femaleCapacity: 10,
    scale: "LARGE",
    malePrice: 40000,
    femalePrice: 30000,
    status: "신청 가능",
    jobGroups: ["프리랜서", "자영업", "기타"],
    mood: ["활동적인", "트렌디한"],
    area: "홍대·연남",
    district: "MAPO",
    locationPrecision: "DISTRICT",
    stationName: null,
    lat: 37.5563,
    lng: 126.9236,
    popularity: 640,
    createdAt: kstFromThisMonday(-5, "21:00"),
    isLiked: false,
    description:
      "심야 시간대 로테이션 소개팅입니다. 정확한 장소는 신청 확정 후 개별 안내됩니다.",
    venueName: null,
    address: null,
    externalApplyUrl: "https://example.com/apply/evt-003",
    attendeeListUrl: null,
  },
  {
    ...BASE,
    id: "evt-004",
    title: "을지로 소수정예 5:5 다이닝 소개팅",
    shortTitle: "을지로 5:5",
    provider: PROVIDER_DETAIL["prv-003"],
    thumbnailUrl: "/mock/event-euljiro.jpg",
    images: ["/mock/event-euljiro.jpg"],
    date: kstFromThisMonday(6, "18:30"),
    dateLabel: "9/6(일)",
    timeLabel: "18:30",
    timeSlot: "DINNER",
    birthYearFrom: 1988,
    birthYearTo: 1995,
    maleCapacity: 5,
    femaleCapacity: 5,
    scale: "SMALL",
    // 가격이 신청 폼 안에만 있어 등록 시점에 확보하지 못한 건
    malePrice: null,
    femalePrice: null,
    status: "신청 가능",
    jobGroups: ["전문직", "대기업"],
    mood: ["차분한", "고급스러운"],
    area: "을지로·종로",
    district: "JUNG",
    locationPrecision: "EXACT",
    stationName: null,
    lat: 37.5663,
    lng: 126.9911,
    popularity: 720,
    createdAt: kstFromThisMonday(-7, "09:30"),
    isLiked: false,
    description:
      "10인 정원의 코스 다이닝 소개팅입니다. 한 테이블에서 코스마다 자리를 바꿉니다. 참가비는 주최사 신청 페이지에서 확인해주세요.",
    venueName: "을지 다이닝",
    address: "서울 중구 을지로3가 302-4",
    externalApplyUrl: "https://example.com/apply/evt-004",
    attendeeListUrl: null,
  },
  {
    ...BASE,
    id: "evt-005",
    title: "잠실 브런치 로테이션 소개팅",
    shortTitle: "잠실 브런치",
    provider: PROVIDER_DETAIL["prv-003"],
    thumbnailUrl: "/mock/event-jamsil.jpg",
    images: ["/mock/event-jamsil.jpg"],
    date: kstFromThisMonday(12, "11:00"),
    dateLabel: "9/12(토)",
    timeLabel: "11:00",
    timeSlot: "MORNING",
    birthYearFrom: 1992,
    birthYearTo: 1998,
    maleCapacity: 6,
    femaleCapacity: 6,
    scale: "STANDARD",
    malePrice: 38000,
    femalePrice: 28000,
    status: "신청 가능",
    jobGroups: ["중견기업", "공기업", "프리랜서"],
    mood: ["편안한", "차분한"],
    area: "잠실·송파",
    district: "SONGPA",
    locationPrecision: "STATION",
    stationName: "잠실새내역",
    lat: 37.5111,
    lng: 127.0863,
    popularity: 810,
    createdAt: kstFromThisMonday(-3, "11:20"),
    isLiked: true,
    description:
      "낮 시간대 브런치 로테이션입니다. 술 없이 진행되고, 코스별로 자리를 두 번 바꿉니다.",
    venueName: null,
    address: null,
    externalApplyUrl: "https://example.com/apply/evt-005",
    attendeeListUrl: null,
  },
  {
    ...BASE,
    id: "evt-006",
    title: "여의도 오후 티타임 소개팅",
    shortTitle: "여의도 티타임",
    provider: PROVIDER_DETAIL["prv-004"],
    // 정보 등록에는 동의했지만 **이미지 사용 동의를 주지 않은** 주최사 (7.2).
    // 이미지가 없다고 소개팅을 숨기지 않는다 — 카드는 대체 표시로 떨어진다
    thumbnailUrl: null,
    images: [],
    date: kstFromThisMonday(13, "14:00"),
    dateLabel: "9/13(일)",
    timeLabel: "14:00",
    timeSlot: "AFTERNOON",
    birthYearFrom: 1995,
    birthYearTo: 2002,
    maleCapacity: 8,
    femaleCapacity: 8,
    scale: "STANDARD",
    malePrice: 33000,
    femalePrice: 25000,
    status: "신청 가능",
    jobGroups: ["대기업", "외국계", "기타"],
    mood: ["편안한", "네트워킹"],
    area: "여의도·영등포",
    district: "YEONGDEUNGPO",
    locationPrecision: "DISTRICT",
    stationName: null,
    lat: 37.5285,
    lng: 126.9327,
    popularity: 560,
    createdAt: kstFromThisMonday(-2, "16:40"),
    isLiked: false,
    description:
      "디저트 카페를 대관해 진행하는 오후 로테이션 소개팅입니다. 20분씩 5라운드로 진행됩니다.",
    venueName: null,
    address: null,
    externalApplyUrl: "https://example.com/apply/evt-006",
    attendeeListUrl: null,
  },
  {
    ...BASE,
    id: "evt-007",
    title: "한남 로테이션 소개팅 9:9",
    shortTitle: "한남 9:9",
    provider: PROVIDER_DETAIL["prv-001"],
    thumbnailUrl: "/mock/event-hannam.jpg",
    images: ["/mock/event-hannam.jpg"],
    date: kstFromThisMonday(4, "20:00"),
    dateLabel: "9/4(금)",
    timeLabel: "20:00",
    timeSlot: "DINNER",
    birthYearFrom: 1991,
    birthYearTo: 1997,
    maleCapacity: 9,
    femaleCapacity: 9,
    scale: "STANDARD",
    // 라운지 대관 프리미엄 건. 가격 상한 칩 3종(3만/5만/7만)이 각각 다른 결과를
    // 내려면 5만원을 넘는 건이 하나는 있어야 한다 — 없으면 5만·7만 칩이 같은 필터다
    malePrice: 69000,
    femalePrice: 55000,
    // 인기 상위인데 마감된 건. 홈 '이번 주 인기' 첫 화면에서 마감 배지가 보인다
    status: "마감",
    jobGroups: ["전문직", "외국계", "대기업"],
    mood: ["고급스러운", "차분한"],
    area: "이태원·한남",
    district: "YONGSAN",
    locationPrecision: "EXACT",
    stationName: null,
    lat: 37.5347,
    lng: 127.0016,
    popularity: 1040,
    createdAt: kstFromThisMonday(-20, "13:00"),
    isLiked: false,
    description:
      "라운지를 통째로 대관해 진행합니다. 라운드마다 좌석이 재배치되고, 마지막에 자유 대화 시간이 있습니다.",
    venueName: "한남 라운지 서울",
    address: "서울 용산구 한남동 738-11",
    externalApplyUrl: "https://example.com/apply/evt-007",
    // 참석자 리스트 표시에 동의한 유일한 주최사 (7.2)
    attendeeListUrl: "https://example.com/providers/rotation-seoul/attendees/evt-007",
  },
  {
    ...BASE,
    id: "evt-008",
    title: "신촌 사회초년생 로테이션 소개팅 4:4",
    shortTitle: "신촌 4:4",
    provider: PROVIDER_DETAIL["prv-004"],
    // 이미지 사용 동의는 **주최사 단위**다. prv-004 는 정보 등록만 동의했으므로
    // evt-006 과 마찬가지로 비어 있어야 한다 — 한쪽만 채우면 같은 주최사인데
    // 회차마다 동의 범위가 다른 셈이 된다 (7.2)
    thumbnailUrl: null,
    images: [],
    date: kstFromThisMonday(19, "19:30"),
    dateLabel: "9/19(토)",
    timeLabel: "19:30",
    timeSlot: "DINNER",
    birthYearFrom: 1997,
    birthYearTo: 2003,
    maleCapacity: 4,
    femaleCapacity: 4,
    scale: "SMALL",
    malePrice: 29000,
    femalePrice: 19000,
    status: "신청 가능",
    jobGroups: ["기타", "중견기업"],
    mood: ["편안한", "활동적인"],
    area: "신촌·이대",
    district: "SEODAEMUN",
    locationPrecision: "STATION",
    stationName: "신촌역",
    lat: 37.5559,
    lng: 126.9368,
    popularity: 430,
    createdAt: kstFromThisMonday(-9, "20:10"),
    isLiked: false,
    description:
      "8인 소규모 로테이션입니다. 사회초년생 위주로 모집하며, 음료 1잔이 포함됩니다.",
    venueName: null,
    address: null,
    externalApplyUrl: "https://example.com/apply/evt-008",
    attendeeListUrl: null,
  },
];
