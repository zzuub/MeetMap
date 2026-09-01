/**
 * 도메인 마스터 데이터.
 * 근거: docs/frontend-feature-spec.md 3.4 / 4.3 / 6.1 / 6.3 / 6.4 / 10.3 / 10.5
 *
 * 화면에 리터럴로 박지 않고 여기서만 정의한다. 서버가 마스터를 내려주게 되면
 * 이 파일이 fallback 겸 타입 소스로 남는다.
 */

/* ── 카테고리 (3.4) ─────────────────────────────────────── */

export const CATEGORIES = [
  "소개팅파티",
  "와인",
  "전시",
  "러닝",
  "보드게임",
  "쿠킹",
  "음악",
  "피크닉",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** 프로필 관심 카테고리 최대 선택 수 (3.4) */
export const MAX_INTEREST_CATEGORIES = 5;

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

export const TIME_SLOTS = [
  { code: "ALL", label: "전체" },
  { code: "LUNCH", label: "점심" },
  { code: "DINNER", label: "저녁" },
  { code: "LATE_NIGHT", label: "심야" },
] as const;

/* ── 정렬 (6.2) ─────────────────────────────────────────── */

export const SORT_OPTIONS = [
  { code: "popular", label: "인기순" },
  { code: "latest", label: "최신순" },
  { code: "priceAsc", label: "가격 낮은순" },
  { code: "priceDesc", label: "가격 높은순" },
] as const;

export const DEFAULT_SORT = "popular" as const;

/* ── 필터 시트 (6.4) ────────────────────────────────────── */

export const MOOD_TAGS = [
  "차분한",
  "트렌디한",
  "활동적인",
  "편안한",
  "고급스러운",
  "네트워킹",
] as const;

export const GENDER_FILTERS = [
  { code: "ANY", label: "무관" },
  { code: "MALE", label: "남성 참가" },
  { code: "FEMALE", label: "여성 참가" },
] as const;

/** `20대 위주` 토글이 켜졌을 때의 상한 (6.4) */
export const ONLY_20S_MAX_AGE = 29;

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

/** 마감임박 알림 발송 기준 잔여 좌석 (10.3) */
export const DEADLINE_ALERT_SEAT_THRESHOLD = 3;

/* ── 검색 (11.1) ────────────────────────────────────────── */

export const SEARCH_DEBOUNCE_MS = 300;
export const RECENT_KEYWORDS_KEY = "meetmap:recent-keywords";
export const COMPARE_STORAGE_KEY = "meetmap:compare";

/* ── 토스트 (2.5) ───────────────────────────────────────── */

export const TOAST_DURATION_MS = 1800;
