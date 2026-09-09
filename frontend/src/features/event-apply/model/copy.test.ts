import { describe, expect, it } from "vitest";
import { OUTBOUND_COPY, REQUIRED_PHRASES, type OutboundCopyKey } from "./copy";

/**
 * 결제 비대행 고지(7.3)는 **타협 불가**다. jsdom 을 붙이지 않으므로(4.10) 모달이
 * 실제로 그리는지는 여기서 볼 수 없고, **문구가 조용히 무뎌지는 것**만 잠근다 —
 * 실무에서 실제로 일어나는 쪽은 "고지를 지웠다"가 아니라 "짧게 다듬었다"이다.
 */
describe("외부 이동 모달 문구", () => {
  const keys = Object.keys(OUTBOUND_COPY) as OutboundCopyKey[];

  it.each(keys)("%s 는 비어 있지 않다", (key) => {
    expect(OUTBOUND_COPY[key].trim().length).toBeGreaterThan(0);
  });

  it.each(keys)("%s 가 필수 구절을 잃지 않는다", (key) => {
    for (const phrase of REQUIRED_PHRASES[key]) {
      expect(OUTBOUND_COPY[key]).toContain(phrase);
    }
  });

  /**
   * 7.3 이 `필수` 로 표시한 두 항목. 이 둘에서 구절 검사가 사라지면 위 테스트가
   * 통과해도 아무것도 안 지키는 상태가 된다 — 검사 자체가 있는지를 본다.
   */
  it("법적 고지와 하단 경고에는 반드시 검사할 구절이 있다", () => {
    expect(REQUIRED_PHRASES.notice.length).toBeGreaterThan(0);
    expect(REQUIRED_PHRASES.warning.length).toBeGreaterThan(0);
  });
});
