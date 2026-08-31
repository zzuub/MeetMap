import type { MembershipStatus, Role, Session } from "./types";

/**
 * 라우트 접근 규칙 (dev-plan 3.5).
 *
 * 경로 프리픽스 → 필요한 역할·상태. `proxy.ts` 와 화면 양쪽이 이 표 하나를 본다.
 *
 * ⚠️ **여기서 통과했다고 안전한 게 아니다.** 클라이언트/엣지 판정은 UX용이고,
 * 실제 권한 검증은 API 서버가 매 요청 다시 한다.
 */
export interface AccessRule {
  prefix: string;
  roles: readonly Role[];
  /** 이 상태여야 통과. 미지정이면 상태를 보지 않는다. */
  status?: MembershipStatus;
  /** 접근 실패 시 보낼 경로 */
  redirectTo: string;
}

/** 비로그인으로 접근 가능한 경로. 탐색 퍼널은 열어둔다. */
export const PUBLIC_PREFIXES = [
  "/onboarding",
  "/explore",
  "/events",
  "/search",
  "/policy",
] as const;

/**
 * 보호 경로.
 *
 * 매칭은 프리픽스 최장 일치여야 한다 — `/provider/pending` 이 `/provider` 보다
 * 먼저 검사되지 않으면 영원히 매칭되지 않고, 심사 대기 사용자가 무한 리다이렉트에
 * 빠진다. 이걸 **선언 순서에 맡기면 누가 배열을 재정렬하는 순간 조용히 깨진다.**
 * 그래서 여기서는 순서를 신경 쓰지 않고 적고, 아래에서 길이순으로 정렬한다.
 */
const RULE_DECLARATIONS: readonly AccessRule[] = [
  { prefix: "/likes", roles: ["USER"], redirectTo: "/onboarding" },
  { prefix: "/compare", roles: ["USER"], redirectTo: "/onboarding" },
  { prefix: "/my", roles: ["USER"], redirectTo: "/onboarding" },
  { prefix: "/reviews/write", roles: ["USER"], redirectTo: "/onboarding" },
  {
    prefix: "/provider",
    roles: ["PROVIDER"],
    status: "ACTIVE",
    redirectTo: "/provider/pending",
  },
  {
    prefix: "/provider/signup",
    roles: ["USER", "PROVIDER"],
    redirectTo: "/onboarding",
  },
  {
    prefix: "/provider/pending",
    roles: ["PROVIDER"],
    status: "PENDING",
    redirectTo: "/provider",
  },
  { prefix: "/admin", roles: ["ADMIN"], status: "ACTIVE", redirectTo: "/" },
];

/** 프리픽스가 긴 규칙이 먼저 오도록 정렬한다. 선언 순서에 의존하지 않는다. */
export const ACCESS_RULES: readonly AccessRule[] = [...RULE_DECLARATIONS].sort(
  (a, b) => b.prefix.length - a.prefix.length,
);

export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function findAccessRule(pathname: string): AccessRule | null {
  return (
    ACCESS_RULES.find(
      (rule) =>
        pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
    ) ?? null
  );
}

export type AccessDecision =
  | { allowed: true }
  | { allowed: false; redirectTo: string; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

export function checkAccess(
  pathname: string,
  session: Session | null,
): AccessDecision {
  const rule = findAccessRule(pathname);
  if (!rule) return { allowed: true };

  if (!session) {
    return {
      allowed: false,
      redirectTo: "/onboarding",
      reason: "UNAUTHENTICATED",
    };
  }

  if (!rule.roles.includes(session.role)) {
    return { allowed: false, redirectTo: rule.redirectTo, reason: "FORBIDDEN" };
  }

  if (rule.status && session.status !== rule.status) {
    return { allowed: false, redirectTo: rule.redirectTo, reason: "FORBIDDEN" };
  }

  return { allowed: true };
}
