/**
 * 도메인 마스터 데이터.
 * 근거: docs/spec/ — 3.4 / 4.3 (온보딩·위치권한) / 6.1 / 6.3 / 6.4 (탐색) / 10.3 / 10.5 (마이·알림·후기)
 *
 * 화면에 리터럴로 박지 않고 여기서만 정의한다. 서버가 마스터를 내려주게 되면
 * 이 파일이 fallback 겸 타입 소스로 남는다.
 */

/* ── 지역: 동 단위 (3.4 / 4.3) ──────────────────────────── */

/**
 * 온보딩(6개)과 위치 권한 화면(8개)이 불일치했던 항목.
 * dev-plan.md blocking #3 기본안에 따라 **8개로 통일**한다.
 *
 * 이 `area` 축은 사용자 프로필·선호 지역 표시 전용이다.
 * 지도/탐색의 지역 필터는 아래 `SEOUL_DISTRICTS`(구 단위)를 쓴다. (6.1)
 */
export const AREAS = [
  "성수·건대",
  "강남·역삼",
  "홍대·연남",
  "을지로·종로",
  "이태원·한남",
  "잠실·송파",
  "여의도·영등포",
  "신촌·이대",
] as const;

export type Area = (typeof AREAS)[number];

/** 선호 지역 최대 선택 수 (3.4 / 4.3) */
export const MAX_PREFERRED_AREAS = 3;

/**
 * 지역 **대표 좌표**. 좌표 하나를 지역 마스터로 되돌릴 때 쓴다 (4.2 역지오코딩).
 *
 * `Record<Area, …>` 라 `AREAS` 에 지역이 늘면 **여기서 컴파일 에러가 난다** —
 * 좌표 없는 지역이 생기면 역지오코딩이 그 지역을 영원히 고르지 못한다.
 *
 * ⚠️ **사용자 좌표를 저장하는 자리가 아니다.** 4.1 의 고정 문구가 막는 것은
 * 사용자의 위치이고, 이 값은 지역 마스터의 정적 참조점이다 (`decisions.md` 4.54).
 *
 * 값은 각 지역 대표 역(성수역·강남역…)의 근사치이며 **목 회차 좌표와 독립**이다 —
 * 같은 값을 베끼면 `app/_consistency/` 의 검증이 공허해진다 (4.21 과 같은 자리).
 */
export const AREA_CENTERS: Record<Area, { lat: number; lng: number }> = {
  "성수·건대": { lat: 37.5445, lng: 127.0557 },
  "강남·역삼": { lat: 37.4979, lng: 127.0276 },
  "홍대·연남": { lat: 37.5563, lng: 126.9236 },
  "을지로·종로": { lat: 37.5663, lng: 126.9911 },
  "이태원·한남": { lat: 37.5346, lng: 126.9946 },
  "잠실·송파": { lat: 37.5133, lng: 127.1 },
  "여의도·영등포": { lat: 37.5215, lng: 126.9242 },
  "신촌·이대": { lat: 37.5559, lng: 126.9368 },
};

/* ── 지역: 시/도 → 구 2단 (6.3) ─────────────────────────── */

/**
 * MVP1은 서울만 서비스한다. 나머지는 "오픈 예정"으로 비활성 노출하되,
 * 확장 시 이 자리에서 바로 켤 수 있도록 구조를 미리 만들어 둔다.
 */
export const PROVINCES = [
  { code: "SEOUL", label: "서울", enabled: true },
  { code: "GYEONGGI", label: "경기", enabled: false },
  { code: "INCHEON", label: "인천", enabled: false },
  { code: "DAEJEON", label: "대전", enabled: false },
  { code: "BUSAN", label: "부산", enabled: false },
] as const;

export type ProvinceCode = (typeof PROVINCES)[number]["code"];

export const DEFAULT_PROVINCE: ProvinceCode = "SEOUL";

/**
 * 서울 25개 자치구.
 * 화면에는 **실제 소개팅이 있는 구만** 노출한다(6.3). 필터링은 조회 결과 기준이며,
 * 이 배열은 코드↔라벨 매핑의 원본이다.
 */
export const SEOUL_DISTRICTS = [
  { code: "GANGNAM", label: "강남구" },
  { code: "GANGDONG", label: "강동구" },
  { code: "GANGBUK", label: "강북구" },
  { code: "GANGSEO", label: "강서구" },
  { code: "GWANAK", label: "관악구" },
  { code: "GWANGJIN", label: "광진구" },
  { code: "GURO", label: "구로구" },
  { code: "GEUMCHEON", label: "금천구" },
  { code: "NOWON", label: "노원구" },
  { code: "DOBONG", label: "도봉구" },
  { code: "DONGDAEMUN", label: "동대문구" },
  { code: "DONGJAK", label: "동작구" },
  { code: "MAPO", label: "마포구" },
  { code: "SEODAEMUN", label: "서대문구" },
  { code: "SEOCHO", label: "서초구" },
  { code: "SEONGDONG", label: "성동구" },
  { code: "SEONGBUK", label: "성북구" },
  { code: "SONGPA", label: "송파구" },
  { code: "YANGCHEON", label: "양천구" },
  { code: "YEONGDEUNGPO", label: "영등포구" },
  { code: "YONGSAN", label: "용산구" },
  { code: "EUNPYEONG", label: "은평구" },
  { code: "JONGNO", label: "종로구" },
  { code: "JUNG", label: "중구" },
  { code: "JUNGNANG", label: "중랑구" },
] as const;

export type DistrictCode = (typeof SEOUL_DISTRICTS)[number]["code"];

/** 지역 미선택 = 서울 전지역 */
export const ALL_DISTRICTS = "ALL" as const;

export const DISTRICT_LABEL: Record<string, string> = Object.fromEntries(
  SEOUL_DISTRICTS.map((d) => [d.code, d.label]),
);

/* ── 시간대 (6.2) ───────────────────────────────────────── */

/**
 * 경계는 **시작 시각** 기준이다 — 12:00 시작은 `오후`, 21:00 시작은 `심야`.
 * 오전 `~12:00` / 오후 `12:00~17:00` / 디너 `17:00~21:00` / 심야 `21:00~`
 *
 * 2026-09-01 개편으로 3종(`LUNCH`/`DINNER`/`LATE_NIGHT`) → 4종이 됐다.
 * 삭제한 카테고리 축을 이 축이 대신한다.
 *
 * ⚠️ 화면에서는 **해당 건수가 0인 슬롯의 칩을 노출하지 않는다**(6.2).
 * 오전 소개팅은 실제로 드물다 — 항상 빈 결과만 내놓는 칩은 노이즈다.
 */
export const TIME_SLOTS = [
  { code: "ALL", label: "전체" },
  { code: "MORNING", label: "오전" },
  { code: "AFTERNOON", label: "오후" },
  { code: "DINNER", label: "디너" },
  { code: "LATE_NIGHT", label: "심야" },
] as const;

/**
 * 시간대 경계 — **KST 시(hour)** 다. 각 값은 그 슬롯이 시작되는 시각이고,
 * `오전` 은 첫 경계 이전 전부다. 판정은 `entities/event` 의 `currentTimeSlot` 이 한다.
 */
export const TIME_SLOT_START_HOUR = {
  AFTERNOON: 12,
  DINNER: 17,
  LATE_NIGHT: 21,
} as const;

/* ── 정렬 (6.2) ─────────────────────────────────────────── */

/**
 * ⚠️ `latest` 는 **소개팅 회차의 `createdAt`** 기준이다. 개최일 임박순도, 주최사
 * 입점일도 아니다. 홈 `새로 등록된 소개팅` 섹션과 같은 축이다 (5.3).
 *
 * `rating` 은 **주최사 평점** 기준이다 — 소개팅 회차에는 평점이 존재하지 않는다
 * (7.4). 정렬 키는 원본 평균이 아니라 베이지안 보정값(`ratingScore`)이고,
 * 산출은 `entities/provider` 의 `ratingScore` 가 한다.
 */
export const SORT_OPTIONS = [
  { code: "popular", label: "인기순" },
  { code: "latest", label: "최신순" },
  { code: "rating", label: "평점 높은순" },
  { code: "priceAsc", label: "가격 낮은순" },
  { code: "priceDesc", label: "가격 높은순" },
] as const;

export const DEFAULT_SORT = "popular" as const;

/**
 * **인증 주체가 필요한 정렬** (6.2). 가격 정렬은 사용자 성별 기준값을 쓰므로
 * (여성→`femalePrice`, 남성→`malePrice`) 성별을 모르는 게스트에게는 축이 성립하지
 * 않는다. `eligibleOnly`·`maxPrice` 와 같은 부류다.
 *
 * 화면은 이 목록으로 옵션을 감추고, 값의 유효성은 파싱이 판정한다
 * (`decisions.md` 4.30 — 게이트는 파싱 한 곳이다).
 */
export const VIEWER_SORTS = ["priceAsc", "priceDesc"] as const;

/* ── 주최사 평점 (7.4 / 6.2) ────────────────────────────── */

/**
 * 평점 **표시** 임계. 후기가 이 값 미만이면 평점 숫자를 숨기고 `후기 N건` 만 쓴다.
 *
 * 5건에서도 한 사람이 평점을 0.8 흔든다(4.6 → 3.8). 그럼에도 5로 잡는 것은
 * 정원 7:7 중 참여 인증까지 마치고 후기를 쓰는 사람이 **회차당 2~4명**이기
 * 때문이다. 10건을 요구하면 주최사 대부분이 3~4회차를 치를 때까지 평점이 뜨지
 * 않아 기능이 사실상 죽는다.
 *
 * ⚠️ **정렬에는 이 임계를 쓰지 않는다.** 하드 컷은 절벽을 만든다 — 4건짜리가
 * 목록에서 빠졌다가 5번째 후기에 1위로 점프한다. 정렬은 아래 보정식이 맡는다.
 */
export const REVIEW_DISPLAY_MIN_COUNT = 5;

/**
 * 베이지안 보정 상수 (6.2 `평점 높은순`).
 *
 *   ratingScore = (C × m + 평점합) / (C + n)
 *
 * `C`(신뢰 상수)는 "전체 평균으로 얼마나 끌어당길지", `m`은 그 전체 평균이다.
 * 후기 0건 주최사는 `m` 을 그대로 받아 **맨 아래가 아니라 중간**에 놓인다 —
 * 이게 평점 정렬이 신규 주최사를 구조적으로 묻지 않는 이유다.
 *
 * 실제 후기 분포가 쌓이면 재산정한다. 프론트는 서버가 내려준 `ratingScore` 를
 * 정렬에 쓰기만 하므로 **상수가 바뀌어도 화면 코드는 바뀌지 않는다**
 * (dev-plan 4장 #14).
 */
export const RATING_PRIOR_WEIGHT = 10;
export const RATING_PRIOR_MEAN = 4.3;

/* ── 필터 시트 (6.4) ────────────────────────────────────── */

/** 2층 · 일정 — 단일 선택 */
export const WHEN_OPTIONS = [
  { code: "ALL", label: "전체" },
  { code: "THIS_WEEK", label: "이번 주" },
  { code: "LATER", label: "그 이후" },
] as const;

/** 3층 · 규모 — 단일 선택. 정원 합계 기준 파생값이다 */
export const SCALE_OPTIONS = [
  { code: "ALL", label: "전체" },
  { code: "SMALL", label: "소수정예" },
  { code: "STANDARD", label: "표준" },
  { code: "LARGE", label: "대규모" },
] as const;

/**
 * 규모 경계 — **한쪽 성별 정원** 기준이다. 6.4 의 `소수정예 5:5 이하 /
 * 표준 6:6~9:9 / 대규모 10:10 이상` 을 그대로 옮긴 값이다.
 *
 * 로테이션 소개팅은 **남녀 동수 모집이 원칙**이라 `maleCapacity === femaleCapacity`
 * 다. 판정은 `entities/event` 의 `deriveScale` 이 하고, 비대칭 건이 들어와도
 * 답이 나오도록 큰 쪽을 기준으로 삼는다.
 */
export const SCALE_SMALL_MAX_PER_SIDE = 5;
export const SCALE_LARGE_MIN_PER_SIDE = 10;

/** 3층 · 분위기 — 다중 선택 (OR 조건) */
export const MOOD_TAGS = [
  "차분한",
  "트렌디한",
  "활동적인",
  "편안한",
  "고급스러운",
  "네트워킹",
] as const;

/**
 * 3층 · 가격 상한 칩 — 단일 선택. 미선택이 `제한 없음` 이다.
 * **사용자 성별 기준값**과 비교한다. 게스트에게는 그룹 자체를 숨긴다 (6.1 / 6.4).
 */
export const PRICE_CAPS = [
  { value: 30000, label: "3만원" },
  { value: 50000, label: "5만원" },
  { value: 70000, label: "7만원" },
] as const;

/**
 * 참석자 직업군 **추천 태그** (7.1 정보 카드 / dev-plan 4장 #11 기본안).
 *
 * ⚠️ **닫힌 마스터가 아니다.** 등록 폼(P6-2 / P7-2)에서 주최사·운영자가 태그를
 * 직접 입력할 수 있고, 저장되는 값은 그 원문이다. 그래서 `jobGroups` 의 타입은
 * `string[]` 이고 이 배열에서 파생된 유니온 타입을 두지 않는다.
 *
 * 이 목록의 역할은 **입력 시 먼저 제안하는 것**이다. 자유 입력을 그대로 두면
 * `대기업`·`대기업 재직`·`대기업(IT)` 이 서로 다른 태그가 되어 상세 화면에서
 * 비교가 안 된다. 기존 태그를 우선 노출해 표기가 수렴하도록 만든다.
 *
 * 입력 UI 제약(등록 폼에서 지킨다):
 * - 기존 태그를 사용 빈도순으로 먼저 보여주고, 새 태그는 한 단계 더 눌러 만든다
 * - **회사명·학교명은 받지 않는다.** 직업"군" 단위여야 한다 — 날짜·소규모 인원과
 *   결합하면 참석자가 식별될 수 있고, 그러면 7.2 의 집계값 원칙을 어긴다
 *
 * 필터 축으로 승격할 때는 그때 정규화 매핑을 두되 원문은 보존한다.
 */
export const JOB_GROUPS = [
  "대기업",
  "중견기업",
  "공기업",
  "전문직",
  "외국계",
  "자영업",
  "프리랜서",
  "기타",
] as const;

/* ── 비교함 (8장) ───────────────────────────────────────── */

export const MAX_COMPARE_ITEMS = 3;

/* ── 후기 (10.5) ────────────────────────────────────────── */

export const REVIEW_TAGS = {
  분위기: ["분위기 좋아요", "대화하기 편했어요", "조용한 편이에요"],
  진행: ["진행이 매끄러워요", "시간 관리가 좋아요", "진행자가 친절해요"],
  장소: ["접근성이 좋아요", "공간이 쾌적해요", "주차가 편해요"],
} as const;

export const REVIEW_BODY_MIN = 10;
export const REVIEW_BODY_MAX = 500;

/** 별점별 라벨. 0은 미선택 상태다. (10.5) */
export const RATING_LABELS = [
  "별점을 선택해주세요",
  "아쉬웠어요",
  "그저 그랬어요",
  "괜찮았어요",
  "좋았어요",
  "아주 좋았어요",
] as const;

/* ── 프로필 (3.4) ───────────────────────────────────────── */

export const NICKNAME_MAX_LENGTH = 12;
export const BIRTH_YEAR_MIN = 1975;
export const BIRTH_YEAR_MAX = 2007;
export const BIRTH_YEAR_DEFAULT = 1996;

/* ── 약관 (3.2) ─────────────────────────────────────────── */

export const TERMS_ITEMS = [
  { key: "ageOver19", label: "만 19세 이상입니다", required: true },
  { key: "service", label: "서비스 이용약관", required: true },
  { key: "privacy", label: "개인정보 수집 및 이용", required: true },
  { key: "marketing", label: "마케팅 정보 수신 동의", required: false },
] as const;

/* ── 알림 설정 (10.3) ───────────────────────────────────── */

export const QUIET_HOURS_OPTIONS = [
  { code: "OFF", label: "사용 안 함" },
  { code: "23_08", label: "23시–08시" },
  { code: "00_09", label: "00시–09시" },
] as const;

/* ── 검색 (11.1) ────────────────────────────────────────── */

export const SEARCH_DEBOUNCE_MS = 300;
export const RECENT_KEYWORDS_KEY = "meetmap:recent-keywords";
/**
 * 최근 검색어 보관 개수 — 16장 TBD 에 구현이 정한 기본값. 375×667 에서 두 단어 검색어가
 * 3줄에 들어가 인기 검색어 6위까지 한 화면에 보이는 수다(8개면 4줄 — 재어 보고 줄였다, `decisions.md` 4.69)
 */
export const RECENT_KEYWORDS_MAX = 6;
/** 인기 검색어 표시 개수 (11.1 `Top 6`) */
export const TRENDING_KEYWORDS_MAX = 6;
/** 결과 없음의 추천 검색어 개수 (11.1 칩 네 개). 내용은 인기 검색어에서 온다 (4.68) */
export const SEARCH_SUGGESTIONS_MAX = 4;
export const COMPARE_STORAGE_KEY = "meetmap:compare";

/* ── 토스트 (2.5) ───────────────────────────────────────── */

export const TOAST_DURATION_MS = 1800;
