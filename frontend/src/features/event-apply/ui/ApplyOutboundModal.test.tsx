import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { OUTBOUND_COPY, REQUIRED_PHRASES } from "../model/copy";
import { OutboundNoticeBody, type OutboundNoticeEvent } from "./ApplyOutboundModal";

/**
 * **고지가 실제로 그려지는지** 본다 (7.3 필수 항목).
 *
 * `copy.test.ts` 는 문자열 상수만 잠근다 — 상수는 그대로 두고 JSX 에서
 * `{false && …}` 로 감싸 조용히 감추는 변경을 못 잡는다는 것이 PR #30 리뷰의
 * 지적이었다. 여기가 그 구멍을 메운다.
 *
 * jsdom 을 붙이지 않았다 (4.10 유지). `Modal` 이 아니라 본문 컴포넌트를 직접
 * 렌더하므로 `react-dom/server` 만으로 충분하다 — 포털·`useIsClient` 를 거치지
 * 않는다 (`decisions.md` 4.38).
 */
describe("외부 이동 모달 본문", () => {
  const open: OutboundNoticeEvent = {
    status: "신청 가능",
    birthYearFrom: 1990,
    birthYearTo: 1996,
    maleCapacity: 7,
    femaleCapacity: 7,
    malePrice: 45000,
    femalePrice: 35000,
  };

  const html = (event: OutboundNoticeEvent) =>
    renderToStaticMarkup(<OutboundNoticeBody event={event} />);

  it("법적 고지와 하단 경고가 실제로 렌더된다", () => {
    const markup = html(open);

    for (const phrase of [...REQUIRED_PHRASES.notice, ...REQUIRED_PHRASES.warning]) {
      expect(markup).toContain(phrase);
    }
  });

  it("조건 확인 블록 세 행이 전부 렌더된다 (7.3)", () => {
    const markup = html(open);

    expect(markup).toContain("90~96년생");
    expect(markup).toContain("참가 연령");
    expect(markup).toContain("모집 정원");
    // 참가비는 **남·여 양쪽**이다. 한쪽만 나오면 조건 고지가 성립하지 않는다
    expect(markup).toContain("45,000");
    expect(markup).toContain("35,000");
  });

  it("가격 미확인 회차도 참가비 행을 비우지 않는다", () => {
    const markup = html({ ...open, malePrice: null, femalePrice: null });

    expect(markup).toContain("참가비");
    expect(markup).toContain("링크 확인");
  });

  it("마감 고지는 마감 회차에만 붙는다 (4.37)", () => {
    expect(html(open)).not.toContain(OUTBOUND_COPY.closedNotice);
    expect(html({ ...open, status: "마감" })).toContain(OUTBOUND_COPY.closedNotice);
  });
});
