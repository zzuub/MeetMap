import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/shared/ui";
import { LIKE_TOAST, likeLabel } from "../model/copy";
import { LikeButton } from "./LikeButton";
import { LikeProvider } from "./LikeProvider";

/**
 * ⚠️ **라우터 훅 하나만 대신한다.** 게스트가 찜을 누르면 로그인으로 보내야 해서
 * `useRouter` 가 필요한데, 그 훅은 App Router 컨텍스트 밖에서 던진다. jsdom 을
 * 들이는 대신(4.10 유지) 훅만 세운다 — 검사 대상은 **무엇이 그려지는가** 이고
 * 이동 자체는 브라우저에서 확인한다.
 */
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

/**
 * 찜 버튼이 **실제로 그리는 것**을 본다 (7.2 · 15장).
 *
 * jsdom 은 붙이지 않는다 (4.10). 검사 대상(라벨·`aria-pressed`·히트 영역)은 전부
 * 첫 렌더의 마크업에 있다.
 *
 * ⚠️ **토글 자체는 여기서 검사하지 않는다.** 클릭 → `useOptimistic` → transition 은
 * DOM 이벤트 루프가 필요하고, 그건 jsdom 을 들이는 판단이다. 지금 잠그는 것은
 * **상태별로 무엇이 그려지는가** 이고, 토글의 왕복은 브라우저에서 확인한다.
 */
const noop = async () => ({ ok: true }) as const;

function markup(liked: string[], signInHref: string | null = null) {
  // `LikeProvider` 가 토스트를 띄우므로 그 공급자가 있어야 한다 (2.5)
  return renderToStaticMarkup(
    <ToastProvider>
      <LikeProvider liked={liked} signInHref={signInHref} toggleLike={noop}>
        <LikeButton eventId="evt-1" />
      </LikeProvider>
    </ToastProvider>,
  );
}

describe("찜 버튼 (7.2)", () => {
  /**
   * ⚠️ **리터럴로 단언한다.** 처음에는 `toContain(likeLabel(false))` 로 적었는데
   * 그건 **같은 함수끼리 비교**라 `likeLabel` 이 무엇을 돌려주든 통과했다 —
   * 변이(라벨을 상태와 무관하게 만들기)가 살아남아 드러났다. 4.52 에서 잡은
   * `AFTER_ONBOARDING` 함정과 같은 모양이다.
   */
  it("찜하지 않은 상태와 찜한 상태의 라벨이 다르다", () => {
    expect(markup([])).toContain('aria-label="찜하기"');
    expect(markup(["evt-1"])).toContain('aria-label="찜 해제"');
  });

  it("라벨 두 개가 서로 다르다 — 같으면 스크린리더가 상태를 못 읽는다", () => {
    expect(likeLabel(true)).not.toBe(likeLabel(false));
  });

  it("상태를 색이 아니라 `aria-pressed` 로도 알린다 (15장)", () => {
    expect(markup([])).toContain('aria-pressed="false"');
    expect(markup(["evt-1"])).toContain('aria-pressed="true"');
  });

  it("다른 회차의 찜은 이 버튼을 켜지 않는다", () => {
    // 집합을 통째로 보는 대신 개수만 보는 실수를 잠근다
    expect(markup(["evt-2"])).toContain('aria-pressed="false"');
  });

  /**
   * 15장이 **찜 버튼을 이름으로 지목했다** — `현재 26~30px → 확대 또는 히트영역
   * 확장 필요`. 그 하한의 주인은 `IconButton` 이고 여기서는 결과만 본다.
   */
  it("히트 영역이 44px 하한을 지킨다", () => {
    const html = markup([]);
    const hit = /<button[^>]*class="([^"]*)"/.exec(html)?.[1] ?? "";

    // ⚠️ 허용 값을 **열거하지 않는다.** `size-(11|12)` 로 적으면 새 variant 가 생길
    // 때마다 사람이 목록을 갱신해야 하고, `size-14` 처럼 **하한을 지키는 값도
    // 실패**한다. 규칙 자체를 적는다 — Tailwind `size-N` 은 N×4px 이므로 44px
    // 하한은 N ≥ 11 이다 (PR #40 리뷰)
    const scale = Number(/\bsize-(\d+)\b/.exec(hit)?.[1] ?? 0);

    // 버튼 자신의 크기를 본다. 안쪽 시각 원(`size-9`)이 통과시키지 않도록 한다
    expect(hit, "버튼에 크기 클래스가 없다").toMatch(/\bsize-\d+\b/);
    expect(scale * 4).toBeGreaterThanOrEqual(44);
  });

  it("`button` 이다 — `div + onClick` 이 아니다 (15장 시맨틱)", () => {
    expect(markup([])).toContain('<button type="button"');
  });
});

describe("찜 토스트 (7.2)", () => {
  it("저장과 해제가 서로 다른 문구다", () => {
    // 같은 문구면 방금 무엇을 했는지 알 수 없다
    expect(LIKE_TOAST.liked).not.toBe(LIKE_TOAST.unliked);
  });

  it("해제도 알린다 — 되돌릴 수 있다는 신호다", () => {
    expect(LIKE_TOAST.unliked.trim()).not.toBe("");
  });
});
