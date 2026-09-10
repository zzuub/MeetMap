import { describe, expect, it } from "vitest";
import { TERMS_ITEMS } from "@/shared/config";
import {
  allTermsAgreed,
  EMPTY_AGREEMENT,
  requiredTermsMet,
  setAllTerms,
} from "./terms";

describe("약관 동의 (3.2)", () => {
  it("아무것도 안 고른 상태는 필수를 채우지 못한다", () => {
    expect(requiredTermsMet(EMPTY_AGREEMENT)).toBe(false);
  });

  it("필수 3개를 채우면 선택 없이도 통과한다", () => {
    const agreed = { ...EMPTY_AGREEMENT, ageOver19: true, service: true, privacy: true };

    expect(requiredTermsMet(agreed)).toBe(true);
    // 선택 항목은 판정에 끼지 않는다
    expect(allTermsAgreed(agreed)).toBe(false);
  });

  it("필수 하나라도 빠지면 통과하지 못한다", () => {
    for (const item of TERMS_ITEMS.filter((i) => i.required)) {
      const missing = { ...setAllTerms(true), [item.key]: false };
      expect(requiredTermsMet(missing)).toBe(false);
    }
  });

  it("선택만 빠진 상태는 필수를 채우지만 `전체 동의` 는 아니다", () => {
    const optional = TERMS_ITEMS.find((i) => !i.required);
    expect(optional).toBeDefined();

    const agreed = { ...setAllTerms(true), [optional!.key]: false };
    expect(requiredTermsMet(agreed)).toBe(true);
    expect(allTermsAgreed(agreed)).toBe(false);
  });

  it("전체 동의 토글은 4개를 함께 켜고 끈다", () => {
    expect(allTermsAgreed(setAllTerms(true))).toBe(true);
    expect(requiredTermsMet(setAllTerms(false))).toBe(false);
  });

  it("항목 수가 3.2 의 네 줄과 같다", () => {
    // 항목이 늘거나 줄면 여기서 먼저 걸린다 — 화면·타입·이 규칙이 함께 움직여야 한다
    expect(TERMS_ITEMS).toHaveLength(4);
    expect(TERMS_ITEMS.filter((i) => i.required)).toHaveLength(3);
  });
});
