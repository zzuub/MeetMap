import { describe, expect, it } from "vitest";
import { ACCESS_RULES, checkAccess, isPublicPath } from "./access";
import type { MembershipStatus, Role, Session } from "./types";

/**
 * 라우트 접근 판정 (dev-plan 3.5).
 *
 * 이 로직이 틀리면 **권한 없는 사용자가 화면에 들어오거나, 정당한 사용자가
 * 무한 리다이렉트에 갇힌다.** Phase 0 에서 수동으로 10케이스를 확인했지만
 * 수동 확인은 회귀를 막지 못한다 — 규칙이 추가될 때 자동으로 검증되게 한다.
 */

function session(
  role: Role,
  status: MembershipStatus = "ACTIVE",
): Session {
  return {
    accountId: "acc-1",
    role,
    status,
    isNewUser: false,
    nickname: "테스트",
  };
}

describe("isPublicPath", () => {
  it.each(["/", "/explore", "/events", "/search", "/onboarding", "/policy"])(
    "%s 는 비로그인으로 접근할 수 있다",
    (path) => {
      expect(isPublicPath(path)).toBe(true);
    },
  );

  it("하위 경로도 공개다", () => {
    expect(isPublicPath("/events/evt-001")).toBe(true);
    expect(isPublicPath("/explore?view=map")).toBe(false); // 쿼리는 pathname 에 없다
  });

  it("보호 경로는 공개가 아니다", () => {
    expect(isPublicPath("/likes")).toBe(false);
    expect(isPublicPath("/my/notifications")).toBe(false);
    expect(isPublicPath("/admin")).toBe(false);
  });

  it("공개 프리픽스로 시작만 하는 다른 경로를 공개로 착각하지 않는다", () => {
    // '/events' 로 시작하지만 다른 라우트인 경우
    expect(isPublicPath("/eventsomething")).toBe(false);
  });
});

describe("checkAccess — 규칙이 없는 경로", () => {
  it("보호 대상이 아니면 세션 없이도 통과한다", () => {
    expect(checkAccess("/explore", null)).toEqual({ allowed: true });
    expect(checkAccess("/", null)).toEqual({ allowed: true });
  });
});

describe("checkAccess — 비로그인", () => {
  it.each(["/likes", "/compare", "/my", "/reviews/write/evt-001"])(
    "%s 는 로그인 화면으로 보낸다",
    (path) => {
      expect(checkAccess(path, null)).toEqual({
        allowed: false,
        redirectTo: "/onboarding",
        reason: "UNAUTHENTICATED",
      });
    },
  );

  it("관리자 경로도 로그인 화면으로 보낸다 (존재 여부를 노출하지 않는다)", () => {
    const decision = checkAccess("/admin", null);
    expect(decision).toEqual({
      allowed: false,
      redirectTo: "/onboarding",
      reason: "UNAUTHENTICATED",
    });
  });
});

describe("checkAccess — 역할 판정", () => {
  it("USER 는 개인화 경로에 들어갈 수 있다", () => {
    expect(checkAccess("/likes", session("USER"))).toEqual({ allowed: true });
    expect(checkAccess("/my/notifications", session("USER"))).toEqual({
      allowed: true,
    });
  });

  it("USER 는 관리자 경로에 들어갈 수 없다", () => {
    expect(checkAccess("/admin", session("USER"))).toEqual({
      allowed: false,
      redirectTo: "/",
      reason: "FORBIDDEN",
    });
  });

  it("PROVIDER 는 USER 전용 경로에 들어갈 수 없다", () => {
    // 역할을 하나만 활성화하는 정책이므로 PROVIDER 세션은 USER 경로를 못 쓴다
    expect(checkAccess("/likes", session("PROVIDER"))).toMatchObject({
      allowed: false,
      reason: "FORBIDDEN",
    });
  });

  it("ADMIN 은 관리자 경로에 들어갈 수 있다", () => {
    expect(checkAccess("/admin/events", session("ADMIN"))).toEqual({
      allowed: true,
    });
  });
});

describe("checkAccess — 승인 상태 판정", () => {
  it("승인된 PROVIDER 는 주최사 화면에 들어갈 수 있다", () => {
    expect(checkAccess("/provider", session("PROVIDER", "ACTIVE"))).toEqual({
      allowed: true,
    });
  });

  it("심사 대기 PROVIDER 는 대기 안내 화면으로 보낸다", () => {
    expect(checkAccess("/provider", session("PROVIDER", "PENDING"))).toEqual({
      allowed: false,
      redirectTo: "/provider/pending",
      reason: "FORBIDDEN",
    });
  });

  it("심사 대기 PROVIDER 는 대기 안내 화면 자체에는 들어갈 수 있다", () => {
    // 이게 막히면 무한 리다이렉트가 된다
    expect(
      checkAccess("/provider/pending", session("PROVIDER", "PENDING")),
    ).toEqual({ allowed: true });
  });

  it("승인된 PROVIDER 는 대기 화면으로 돌아가지 않는다", () => {
    expect(
      checkAccess("/provider/pending", session("PROVIDER", "ACTIVE")),
    ).toMatchObject({ allowed: false, redirectTo: "/provider" });
  });

  it("정지된 계정은 차단한다", () => {
    expect(
      checkAccess("/provider", session("PROVIDER", "SUSPENDED")),
    ).toMatchObject({ allowed: false, reason: "FORBIDDEN" });
    expect(checkAccess("/admin", session("ADMIN", "SUSPENDED"))).toMatchObject({
      allowed: false,
      reason: "FORBIDDEN",
    });
  });
});

describe("checkAccess — 최장 프리픽스 일치", () => {
  it("USER 는 주최사 가입 화면에 들어갈 수 있다", () => {
    // '/provider/signup' 이 '/provider' 보다 먼저 매칭되어야 한다.
    // 순서가 뒤바뀌면 개인 회원이 주최사 가입을 시작할 수 없다.
    expect(checkAccess("/provider/signup", session("USER"))).toEqual({
      allowed: true,
    });
  });

  it("규칙 배열이 프리픽스 길이 내림차순으로 정렬되어 있다", () => {
    // 선언 순서를 바꿔도 깨지지 않는다는 것을 보장한다
    const lengths = ACCESS_RULES.map((r) => r.prefix.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => b - a));
  });
});
