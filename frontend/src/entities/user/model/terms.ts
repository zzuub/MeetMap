import { TERMS_ITEMS } from "@/shared/config";
import type { TermsAgreement } from "./types";

/**
 * 약관 동의 규칙 (3.2).
 *
 * **판정이 두 곳에서 필요하다** — 화면의 버튼 라벨(`동의하고 계속하기` ↔
 * `필수 약관에 동의해주세요`)과, 폼을 우회한 제출을 막는 액션의 방어선이다.
 * 두 벌로 짜면 언젠가 서로 다른 답을 낸다.
 *
 * ⚠️ 아래 타입 표기가 **`TERMS_ITEMS` 의 `key` 와 `TermsAgreement` 의 필드가
 * 어긋나면 컴파일 에러**를 낸다. 항목을 더하면서 타입을 안 고치는 경로를 막는다.
 */
export type TermsKey = keyof TermsAgreement;

const TERMS_KEYS: readonly TermsKey[] = TERMS_ITEMS.map((item) => item.key);

const REQUIRED_KEYS: readonly TermsKey[] = TERMS_ITEMS.filter(
  (item) => item.required,
).map((item) => item.key);

export const EMPTY_AGREEMENT: TermsAgreement = {
  ageOver19: false,
  service: false,
  privacy: false,
  marketing: false,
};

/** 필수 3개를 모두 받았는가. 선택(마케팅)은 보지 않는다. */
export function requiredTermsMet(agreement: TermsAgreement): boolean {
  return REQUIRED_KEYS.every((key) => agreement[key]);
}

/** 4개 모두 ON 인가. `전체 동의` 박스의 활성 스타일 조건이다 (3.2) */
export function allTermsAgreed(agreement: TermsAgreement): boolean {
  return TERMS_KEYS.every((key) => agreement[key]);
}

/** 전체 동의 토글. 켜면 4개 전부, 끄면 4개 전부. */
export function setAllTerms(value: boolean): TermsAgreement {
  return { ageOver19: value, service: value, privacy: value, marketing: value };
}
