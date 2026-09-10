import { describe, expect, it } from "vitest";
import {
  AFTER_ONBOARDING,
  ONBOARDING_STEPS,
  safeRedirect,
  signInLanding,
} from "./landing";
import type { Session } from "./types";

const session = (isNewUser: boolean): Session => ({
  accountId: "acc-1",
  role: "USER",
  status: "ACTIVE",
  isNewUser,
  nickname: null,
});

/**
 * `proxy.ts` 가 붙여 보내는 `?redirect=` 를 실제로 읽는 것이 P2-1 이다.
 * 값 검증 없이 이동하면 오픈 리다이렉트라, **적대적 입력을 여기서 잠근다**.
 */
describe("safeRedirect — 앱 밖으로 나가는 값을 전부 거른다", () => {
  it.each([
    ["절대 URL", "https://evil.com"],
    ["스킴 생략", "//evil.com/path"],
    ["역슬래시 스킴 생략", "/\\evil.com"],
    ["역슬래시 두 개", "\\\\evil.com"],
    ["javascript 스킴", "javascript:alert(1)"],
    ["data 스킴", "data:text/html,<script>"],
    ["상대 경로", "explore"],
    ["빈 문자열", ""],
    ["개행 섞기", "/explore\nHost: evil.com"],
    ["널 문자", "/explore\u0000"],
  ])("%s 는 받지 않는다: %s", (_label, raw) => {
    expect(safeRedirect(raw)).toBeNull();
  });

  it("사용자·프록시가 넘길 수 없는 타입도 받지 않는다", () => {
    expect(safeRedirect(null)).toBeNull();
    expect(safeRedirect(undefined)).toBeNull();
  });

  it("지나치게 긴 값은 파싱하지 않는다", () => {
    expect(safeRedirect(`/explore?q=${"a".repeat(600)}`)).toBeNull();
  });

  it("앱 내부 경로는 쿼리스트링까지 그대로 살린다", () => {
    // `proxy.ts` 가 `${pathname}${search}` 로 만들어 붙이는 형태다
    expect(safeRedirect("/explore?sort=latest&slot=DINNER")).toBe(
      "/explore?sort=latest&slot=DINNER",
    );
    expect(safeRedirect("/likes")).toBe("/likes");
  });

  it("온보딩 경로는 되돌려주지 않는다 — 같은 자리로 돌아오는 루프가 된다", () => {
    expect(safeRedirect(ONBOARDING_STEPS.profile)).toBeNull();
    expect(safeRedirect(ONBOARDING_STEPS.login)).toBeNull();
    // 접두어만 같은 다른 경로는 온보딩이 아니다
    expect(safeRedirect("/onboardingx")).toBe("/onboardingx");
  });
});

describe("signInLanding — `isNewUser` 를 판정하는 유일한 자리 (3.1)", () => {
  it("신규 가입자는 약관으로 간다", () => {
    expect(signInLanding(session(true), null)).toBe(ONBOARDING_STEPS.terms);
  });

  it("신규 가입자에게는 redirect 를 적용하지 않는다", () => {
    // 3.5 가 퍼널의 끝을 못 박아 두었다. 값을 5화면 너머로 나르지 않는다
    expect(signInLanding(session(true), "/likes")).toBe(ONBOARDING_STEPS.terms);
  });

  it("기존 회원은 원래 가려던 곳으로 돌아간다", () => {
    expect(signInLanding(session(false), "/likes")).toBe("/likes");
  });

  it("기존 회원의 redirect 가 없거나 위험하면 홈이다", () => {
    expect(signInLanding(session(false), null)).toBe(AFTER_ONBOARDING);
    expect(signInLanding(session(false), "https://evil.com")).toBe(AFTER_ONBOARDING);
  });
});
