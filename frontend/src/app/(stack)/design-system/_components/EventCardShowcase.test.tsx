import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { eventApi } from "@/entities/event";
import { ToastProvider } from "@/shared/ui";
import { EventCardShowcase } from "./EventCardShowcase";

/** 찜 버튼이 게스트를 로그인으로 보낼 때 쓰는 훅만 세운다 — `LikeButton.test.tsx` 와 같다 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

/**
 * `/design-system` 의 카드 쇼케이스가 **던지지 않고 그려지는가**.
 *
 * P2-7 이 카드에 찜 버튼을 넣으면서 `LikeProvider` 를 변형 섹션에만 둘렀는데, 경계값
 * 섹션도 같은 `card()` 로 찜 버튼을 그린다 — 페이지가 P2-7 부터 **500** 이었다. 동적
 * 라우트라 빌드는 통과하고, 이 화면을 렌더하는 테스트가 없어 아무도 몰랐다 (`decisions.md`
 * 4.51 표). 변형이 늘 때마다 이 화면이 저절로 그것을 그리므로 여기가 첫 방어선이다.
 */
describe("카드 쇼케이스", () => {
  it("변형 섹션과 경계값 섹션이 함께 그려진다", async () => {
    const { items } = await eventApi.getList({ limit: 20 });

    const html = renderToStaticMarkup(
      <ToastProvider>
        <EventCardShowcase events={items} />
      </ToastProvider>,
    );

    expect(html).toContain("찜 목록 · 썸네일 66px");
    expect(html).toContain("카드 경계값");
    expect(html).toContain('aria-label="찜하기"');
  });
});
