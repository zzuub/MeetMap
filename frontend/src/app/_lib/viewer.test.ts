import { describe, expect, it } from "vitest";
import { safeRedirect, type Session } from "@/entities/account";
import { signInHrefFor } from "./viewer";

/**
 * 게스트가 찜을 누르면 가는 곳 (2.4 `찜 … 로그인 필요`).
 *
 * 브라우저에서 확인할 수 없는 경로다 — 목 세션 쿠키가 `HttpOnly` 라 개발자도구
 * 밖에서는 로그아웃할 방법이 없다. 그래서 **순수 함수로 떼어 여기서 잠근다.**
 */
const session: Session = {
  accountId: "acc-1",
  role: "USER",
  status: "ACTIVE",
  isNewUser: false,
  nickname: null,
};

describe("찜 버튼의 로그인 목적지", () => {
  it("로그인한 사용자에게는 목적지가 없다 — 버튼이 바로 찜한다", () => {
    expect(signInHrefFor(session, "/")).toBeNull();
  });

  it("게스트는 로그인으로 가되 **원래 보던 화면**을 들고 간다", () => {
    expect(signInHrefFor(null, "/events/evt-1")).toBe(
      "/onboarding?redirect=%2Fevents%2Fevt-1",
    );
  });

  /**
   * ⚠️ **소비 시점의 검증을 통과해야 뜻이 있다.** `safeRedirect` 가 온보딩 경로를
   * 되돌려주지 않으므로(루프 방지 — 4.45), 여기서 만든 값이 그 검증을 통과하는지
   * 확인한다. 만드는 쪽과 쓰는 쪽이 갈리면 게스트가 로그인 뒤 홈으로 떨어진다.
   */
  it("만든 값이 `safeRedirect` 를 통과한다", () => {
    for (const path of ["/", "/explore?area=성수·건대", "/events/evt-1"]) {
      const href = signInHrefFor(null, path);
      const redirect = new URL(href!, "http://x").searchParams.get("redirect");

      // ⚠️ `safeRedirect` 는 `URL` 로 파싱하므로 **한글이 퍼센트 인코딩되어** 돌아온다.
      // 같은 주소이므로 디코드해 비교한다 — 리터럴 비교는 맞는 값을 실패로 잡는다
      expect(decodeURIComponent(safeRedirect(redirect) ?? ""), path).toBe(path);
    }
  });

  it("조건이 걸린 탐색 주소도 통째로 들고 간다", () => {
    // 게스트가 필터를 다시 짜지 않게 하는 것이 이 값의 목적이다
    const href = signInHrefFor(null, "/explore?slot=DINNER&sort=latest");
    expect(href).toContain(encodeURIComponent("/explore?slot=DINNER&sort=latest"));
  });
});
