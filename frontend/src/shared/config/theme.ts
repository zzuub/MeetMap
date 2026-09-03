/**
 * 디자인 토큰의 TS 사본.
 *
 * 원본은 `src/app/globals.css` 의 `@theme` 이다. 이 파일은 CSS 변수를 쓸 수 없는
 * 곳(지도 SDK 마커, canvas, 라이브러리 옵션 객체 등)에서만 참조한다.
 * **JSX 스타일링에는 쓰지 않는다** — Tailwind 유틸리티(`bg-accent`, `text-text-sub`)를 쓴다.
 *
 * 근거: docs/spec/02-공통규칙.md 2.1 / 2.2
 */

export const COLORS = {
  primary: "#14382A",
  secondary: "#96A377",
  accent: "#DDC497",
  accentSoft: "#F5EEDD",
  point: "#A86D58",
  text: "#17170F",
  textSub: "#59503E",
  border: "#EDE7D6",
  surface: "#FFFFFF",
  bg: "#FBFAF6",
  active: "#F0E7D0",
  success: "#4E7B54",
  warning: "#AD6A2E",
  disabledBg: "#C9C2AE",
} as const;

/**
 * `--color-accent` 위에는 흰 텍스트를 올리지 않는다.
 * 대비 ≈1.6:1 로 WCAG 미달이다. 반드시 `COLORS.text` 를 쓴다. (2.2)
 */
export const ON_ACCENT_TEXT = COLORS.text;

export const LAYOUT = {
  /** 콘텐츠 최대 폭. 모바일 우선, 데스크톱에서도 이 폭을 유지한다. */
  shellMaxWidth: 430,
  headerHeight: 56,
  bottomNavHeight: 68,
  fixedCtaHeight: 84,
} as const;

export const DIM = {
  sheet: "rgba(16, 28, 38, 0.38)",
  modal: "rgba(16, 28, 38, 0.42)",
} as const;

/** 지도 마커 색상. 기본은 secondary, 선택 시 accent. (6.3) */
export const MAP_PIN = {
  default: COLORS.secondary,
  selected: COLORS.accent,
  /** 현재 위치 핀은 포인트 컬러 전용 용도 중 하나다. (2.2) */
  currentLocation: COLORS.point,
} as const;
