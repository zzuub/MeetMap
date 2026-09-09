import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApiError, type ApiErrorKind } from "../api/ApiError";
import { formatErrorTimestamp } from "../lib/format";
import { ERROR_COPY } from "./ApiErrorScreen";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

/**
 * 11.2 의 두 규칙이 **실제로 그려지는지** 본다.
 *
 * 문자열 상수만 잠그면 JSX 에서 조용히 감추는 변경을 못 잡는다는 것이 PR #30 의
 * 지적이었다(`ApplyOutboundModal.test.tsx` 와 같은 이유). jsdom 은 붙이지 않는다 —
 * 두 컴포넌트 다 포털·클라이언트 훅을 거치지 않아 `react-dom/server` 로 충분하다.
 */
describe("에러 카드 (11.2)", () => {
  const occurredAt = new Date("2026-09-09T14:32:00+09:00");

  it("오류 코드와 발생 시각을 둘 다 노출한다", () => {
    const markup = renderToStaticMarkup(
      <ErrorState code="NET_TIMEOUT_504" occurredAt={occurredAt} />,
    );

    // CS 문의 식별자다. 둘 중 하나만 남으면 문의를 특정할 수 없다
    expect(markup).toContain("NET_TIMEOUT_504");
    expect(markup).toContain(formatErrorTimestamp(occurredAt));
  });

  it("발생 시각을 렌더 시각으로 대체하지 않는다", () => {
    const markup = renderToStaticMarkup(
      <ErrorState code="SRV_500" occurredAt={occurredAt} />,
    );

    expect(markup).not.toContain(formatErrorTimestamp(new Date()));
  });

  it("재시도가 없는 실패에는 재시도 버튼을 그리지 않는다", () => {
    const markup = renderToStaticMarkup(
      <ErrorState {...ERROR_COPY.FORBIDDEN} code="PERM_403" />,
    );

    expect(markup).toContain("PERM_403");
    // 문구에 `다시 시도해주세요` 가 섞일 수 있으니 버튼의 유무로 본다
    expect(markup).not.toContain("<button");
  });

  it("문구는 8종 전부에 있다", () => {
    const kinds = Object.keys(ERROR_COPY) as ApiErrorKind[];
    expect(kinds).toHaveLength(8);

    for (const kind of kinds) {
      expect(ERROR_COPY[kind].title.length).toBeGreaterThan(0);
      expect(ERROR_COPY[kind].description.length).toBeGreaterThan(0);
    }
  });

  it("`ApiError` 가 코드와 시각을 실제로 들고 있다", () => {
    const error = new ApiError({ kind: "TIMEOUT", code: "NET_TIMEOUT_504", message: "x" });

    expect(error.code).toBe("NET_TIMEOUT_504");
    expect(error.occurredAt).toBeInstanceOf(Date);
  });
});

describe("빈 상태 (11.2)", () => {
  it("액션을 넘기면 실제로 그린다 — 빈 상태는 다음 행동을 제시한다", () => {
    const markup = renderToStaticMarkup(
      <EmptyState title="조건에 맞는 소개팅이 없어요" action={<a href="/explore">필터 초기화</a>} />,
    );

    expect(markup).toContain("필터 초기화");
  });
});
