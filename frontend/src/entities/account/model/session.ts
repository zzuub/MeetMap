import type { MembershipStatus, Role, Session } from "./types";

/** 액세스 토큰 쿠키. 서버가 HttpOnly 로 심는다. */
export const SESSION_COOKIE = "meetmap_at";

/**
 * 목 모드 전용 역할 쿠키.
 *
 * 백엔드 인증이 없는 동안 역할 가드를 실제로 눌러보기 위한 개발용 스위치다.
 * 값 예: `USER`, `PROVIDER:PENDING`, `ADMIN`. 쿠키가 없으면 게스트로 취급한다.
 * 브라우저 콘솔에서 `document.cookie = "meetmap_mock_role=PROVIDER:PENDING;path=/"`.
 *
 * ⚠️ 이 경로는 `USE_MOCK` 이 켜져 있을 때만 동작한다. 실 API 전환 시 죽는다.
 */
export const MOCK_ROLE_COOKIE = "meetmap_mock_role";

interface JwtClaims {
  sub?: string;
  role?: string;
  status?: string;
  isNewUser?: boolean;
  nickname?: string | null;
  exp?: number;
}

/**
 * JWT 페이로드에서 세션을 복원한다.
 *
 * ⚠️ **서명을 검증하지 않는다.** 이 값은 화면 분기(UX)에만 쓰고, 실제 권한은
 * API 서버가 매 요청 재검증한다. 엣지에서 서명 검증까지 하려면 공개키 배포가
 * 필요한데, 그 복잡도를 지불할 만큼의 이득이 없다 — 위조 토큰으로 화면을 열어도
 * 데이터는 서버가 막는다.
 */
export function readSessionFromToken(token: string | undefined): Session | null {
  if (!token) return null;

  const claims = decodeJwtPayload(token);
  if (!claims?.sub || !claims.role) return null;

  if (claims.exp && claims.exp * 1000 < Date.now()) return null;

  return {
    accountId: claims.sub,
    role: claims.role as Role,
    status: (claims.status as MembershipStatus) ?? "ACTIVE",
    isNewUser: claims.isNewUser ?? false,
    nickname: claims.nickname ?? null,
  };
}

/** 목 모드의 `meetmap_mock_role` 쿠키 값을 세션으로 바꾼다. */
export function readMockSession(value: string | undefined): Session | null {
  if (!value) return null;

  const [role, status] = value.split(":");
  if (!role) return null;

  return {
    accountId: "mock-account",
    role: role.toUpperCase() as Role,
    status: (status?.toUpperCase() as MembershipStatus) ?? "ACTIVE",
    isNewUser: false,
    nickname: "목데이터",
  };
}

function decodeJwtPayload(token: string): JwtClaims | null {
  const segments = token.split(".");
  if (segments.length < 2) return null;

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    // atob 는 Edge 런타임과 브라우저 양쪽에서 쓸 수 있다.
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}
