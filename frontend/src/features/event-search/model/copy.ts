import { formatBaseTime } from "@/shared/lib";

/** 근거: docs/spec/09-검색-공통상태.md 11.1 · 11.2 · 목업 `Support.dc.html` 검색 화면 */
export const SEARCH_COPY = {
  /** `AppHeader` 제목 자리가 입력창이라 화면이 갖는 `h1` (4.34 · 4.70) */
  heading: "소개팅 검색",
  inputLabel: "검색어",
  placeholder: "소개팅명, 지역, 주최사 검색",
  clearInput: "검색어 지우기",
  recentTitle: "최근 검색어",
  recentClearAll: "전체 삭제",
  /** 목업 문구 그대로다 — 11.1 에는 0건 문구가 없다 */
  recentEmpty: "최근 검색 기록이 없습니다",
  trendingTitle: "인기 검색어",
  /** 목업의 칩 머리. 칩 내용은 인기 검색어에서 온다 (4.68) */
  suggestionsTitle: "이런 검색은 어때요?",
  /** 11.2 문구 — 11.1 에는 설명이 없다 (4.68) */
  emptyDescription: "철자가 맞는지 확인하거나 더 짧은 키워드로 검색해보세요",
  searchAgain: "다시 검색하기",
} as const;

/**
 * 결과 없음 제목 — 화면 절인 11.1 의 문구다. 11.2 의 `'{키워드}' 결과가 없어요` 와
 * 갈려 있어 골랐고 사양 갱신 대기에 올렸다 (`decisions.md` 4.68).
 */
export function emptyResultTitle(keyword: string): string {
  return `'${keyword}' 검색 결과가 없어요`;
}

/** 칩마다 같은 `✕` 라 스크린리더에는 무엇을 지우는지 말한다 (15장) */
export function removeRecentLabel(keyword: string): string {
  return `최근 검색어 '${keyword}' 삭제`;
}

/** `9/11 10:00 기준` — KST (11.1 `기준 시각`) */
export function trendingBaseLabel(baseAt: string): string {
  return `${formatBaseTime(baseAt)} 기준`;
}
