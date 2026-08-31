/**
 * 표시용 포매터. 순수 함수만 둔다.
 *
 * 서버/클라이언트 양쪽에서 호출되므로 `Intl` 로케일을 `ko-KR` 로 고정한다
 * (환경 로케일에 따라 하이드레이션 불일치가 나는 것을 막기 위함).
 */

const KST = "Asia/Seoul";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

/**
 * 포매터를 모듈 스코프에 한 번만 만든다.
 *
 * `Intl.DateTimeFormat` 생성자는 로케일 데이터 해석이 들어가 JS 객체 생성 중
 * 무거운 축이다. 호출마다 새로 만들면 탐색 리스트 20건 × (날짜 + 시간) =
 * 렌더당 40개, 무한 스크롤 100건이면 200개의 단명 객체가 생긴다.
 * 누수는 아니지만 minor GC 를 계속 유발한다.
 *
 * 옵션이 고정이므로 인스턴스를 공유해도 안전하다. `format`/`formatToParts` 는
 * 상태를 갖지 않는다.
 */
const kstParts = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  weekday: "short",
  hour12: false,
});

const kstTimestamp = new Intl.DateTimeFormat("ko-KR", {
  timeZone: KST,
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** 에러 카드의 발생 시각 표기 (11.2). ErrorState 가 쓴다. */
export function formatErrorTimestamp(date: Date): string {
  return kstTimestamp.format(date);
}

/** 12000 → "12,000원" */
export function formatPrice(krw: number): string {
  return `${krw.toLocaleString("ko-KR")}원`;
}

/** 12000 → "12,000" (단위 없이. Numeric 컴포넌트에서 단위를 따로 붙일 때) */
export function formatNumber(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** ISO → "8/14(목)" — 목업의 `dateLabel` 형식 (12장) */
export function formatEventDate(iso: string): string {
  const parts = getKstParts(new Date(iso));
  return `${parts.month}/${parts.day}(${parts.weekday})`;
}

/** ISO → "19:30" */
export function formatEventTime(iso: string): string {
  const parts = getKstParts(new Date(iso));
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

/** ISO → "8/14(목) 19:30" */
export function formatEventDateTime(iso: string): string {
  return `${formatEventDate(iso)} ${formatEventTime(iso)}`;
}

/**
 * 알림함의 상대 시각 (10.2).
 * 7일이 넘으면 절대 날짜로 떨어뜨린다 — "32일 전"은 읽기 어렵다.
 */
export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "방금 전";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}일 전`;
  return formatEventDate(iso);
}

/** 거리 표기. 위치 권한이 없으면 `null` 이 들어오고 "-" 로 떨어진다 (8장). */
export function formatDistance(km: number | null): string {
  if (km === null) return "-";
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/* ── 내부 ───────────────────────────────────────────────── */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getKstParts(date: Date) {
  const parts = Object.fromEntries(
    kstParts.formatToParts(date).map((p) => [p.type, p.value]),
  );

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour) % 24,
    minute: Number(parts.minute),
    weekday: parts.weekday ?? WEEKDAYS[date.getDay()],
  };
}
