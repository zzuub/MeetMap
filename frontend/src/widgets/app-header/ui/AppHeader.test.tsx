import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AppHeader } from "./AppHeader";

/** 뒤로가기가 쓰는 라우터 훅만 세운다 — `LikeButton.test.tsx` 와 같다 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {}, back: () => {} }) }));

/**
 * 스택 헤더 (2.1 · `decisions.md` 4.34 · 4.70). 제목 자리를 채우는 `children` 슬롯이
 * P2-9 에서 생겼다 — 검색의 입력창이다.
 */
describe("AppHeader", () => {
  it("제목이 있으면 `h1` 을 그린다", () => {
    expect(renderToStaticMarkup(<AppHeader title="알림" />)).toContain(">알림</h1>");
  });

  it("제목 자리를 채우면 `h1` 을 그리지 않는다 — 화면이 자기 `h1` 을 갖는다 (4.34)", () => {
    const html = renderToStaticMarkup(
      <AppHeader>
        <input aria-label="검색어" />
      </AppHeader>,
    );

    expect(html).not.toContain("<h1");
    expect(html).toContain('aria-label="검색어"');
    expect(html).toContain('aria-label="뒤로 가기"');
  });

  it("제목 자리를 채운 헤더는 오른쪽 여백을 비워 두지 않는다 — 맞출 가운데가 없다", () => {
    expect(renderToStaticMarkup(<AppHeader />)).toContain("min-w-11");
    expect(
      renderToStaticMarkup(
        <AppHeader>
          <span />
        </AppHeader>,
      ),
    ).not.toContain("min-w-11");
  });
});
