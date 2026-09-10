import {
  AREAS,
  BIRTH_YEAR_DEFAULT,
  BIRTH_YEAR_MAX,
  BIRTH_YEAR_MIN,
  MAX_PREFERRED_AREAS,
  NICKNAME_MAX_LENGTH,
} from "@/shared/config";
import type { UserProfile } from "./types";

/**
 * 프로필 입력 규칙 (3.4).
 *
 * 화면(버튼 라벨·칩 한도)과 액션(제출 방어선) 양쪽이 같은 답을 내야 해서 순수
 * 함수로 떼어 둔다. 약관의 `requiredTermsMet` 과 같은 이유다.
 */

/** `select` 에 그릴 출생연도. 1975~2007 **내림차순** (3.4) */
export const BIRTH_YEARS: readonly number[] = Array.from(
  { length: BIRTH_YEAR_MAX - BIRTH_YEAR_MIN + 1 },
  (_, index) => BIRTH_YEAR_MAX - index,
);

export type ProfileGender = UserProfile["gender"];

/**
 * 제출 가능 여부 (3.4 `닉네임 + 성별` 충족 시 활성).
 *
 * 출생연도는 기본값이 있어(1996) 언제나 채워져 있고, 선호 지역은 선택이다.
 */
export function isProfileReady(draft: {
  nickname: string;
  gender: ProfileGender | null;
}): boolean {
  return normalizeNickname(draft.nickname).length > 0 && draft.gender !== null;
}

/** 앞뒤 공백을 버리고 12자로 자른다. 붙여넣기로 한도를 넘기는 경로가 있다. */
export function normalizeNickname(value: string): string {
  return value.trim().slice(0, NICKNAME_MAX_LENGTH);
}

/**
 * 지역 마스터에 있는 값만, 최대 3개.
 *
 * 화면은 `clampSelection` 으로 이미 막지만 폼 값은 신뢰할 수 없다 — 없는 지역이
 * 섞이면 서버가 그대로 저장하고, 그 값으로는 아무 회차도 안 걸린다.
 */
export function normalizeAreas(values: readonly string[]): string[] {
  const known = values.filter((value): value is (typeof AREAS)[number] =>
    (AREAS as readonly string[]).includes(value),
  );

  return [...new Set(known)].slice(0, MAX_PREFERRED_AREAS);
}

/** 범위 밖·해석 불가는 기본값으로 떨어뜨린다. 탐색 파라미터 파싱과 같은 태도다 (6.1) */
export function normalizeBirthYear(value: unknown): number {
  const year = Number(value);
  if (!Number.isInteger(year)) return BIRTH_YEAR_DEFAULT;
  if (year < BIRTH_YEAR_MIN || year > BIRTH_YEAR_MAX) return BIRTH_YEAR_DEFAULT;
  return year;
}

export function isProfileGender(value: unknown): value is ProfileGender {
  return value === "F" || value === "M";
}
