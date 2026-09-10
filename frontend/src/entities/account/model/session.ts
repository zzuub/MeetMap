import { USE_MOCK } from "@/shared/config";
import type { MembershipStatus, Role, Session } from "./types";

/** 액세스 토큰 쿠키. 서버가 HttpOnly 로 심는다. */
export const SESSION_COOKIE = "meetmap_at";

/**
 * 목 모드 전용 역할 쿠키.
 *
 * 백엔드 인증이 없는 동안 역할 가드를 실제로 눌러보기 위한 **개발용 스위치**다.
 * 값 예: `USER`, `PROVIDER:PENDING`, `ADMIN`. 쿠키가 없으면 게스트로 취급한다.
 * 브라우저 콘솔에서 `document.cookie = "meetmap_mock_role=PROVIDER:PENDING;path=/"`.
 *
 * ⚠️ **화면이 아니다.** 로그인 버튼은 이 쿠키를 건드리지 않는다 — 여기서 만들어지는
 * 세션은 `isNewUser` 가 항상 `false` 라, 묶는 순간 3.1 의 신규 가입 분기가 영원히
 * 죽는다 (`decisions.md` 4.43). 로그인이 만드는 것은 아래 `MOCK_SESSION_COOKIE` 다.
 *
 * ⚠️ 이 경로는 `USE_MOCK` 이 켜져 있을 때만 동작한다. 실 API 전환 시 죽는다.
 */
export const MOCK_ROLE_COOKIE = "meetmap_mock_role";

/**
 * 목 모드에서 **로그인이 만드는 세션** (P2-1).
 *
 * 실 모드의 `SESSION_COOKIE`(JWT) 자리를 대신한다. 백엔드가 없어 토큰을 발급할
 * 주체가 없으므로 `Session` 을 그대로 JSON 으로 담는다 — 서명이 없다는 점은
 * 실 모드와 다르지 않다. 프론트는 어차피 서명을 검증하지 않기 때문이다 (4.12).
 */
export const MOCK_SESSION_COOKIE = "meetmap_mock_session";

/** 쿠키 하나를 이름으로 읽는 함수. 엣지(`request.cookies`)와 서버(`cookies()`) 양쪽을 받는다. */
export type CookieReader = (name: string) => string | undefined;

interface JwtClaims {
  sub?: string;
  role?: string;
  status?: string;
  isNewUser?: boolean;
  nickname?: string | null;
  exp?: number;
}

/**
 * 현재 세션을 읽는다. **목/실 분기를 아는 유일한 자리다.**
 *
 * 목 모드에서 순서가 있다: **개발용 역할 스위치가 로그인 세션을 이긴다.** 스위치는
 * 로그인이 만들 수 없는 역할(`PROVIDER`·`ADMIN`)을 강제하려고 있는 것이라, 지고
 * 나면 존재 이유가 없어진다. 대신 스위치 쿠키가 남아 있으면 온보딩 퍼널을 눌러볼
 * 수 없으므로 지우고 봐야 한다 (`docs/phase2-notes.md`).
 */
export function readSession(read: CookieReader): Session | null {
  if (USE_MOCK) {
    return (
      readMockSession(read(MOCK_ROLE_COOKIE)) ??
      readMockSessionCookie(read(MOCK_SESSION_COOKIE))
    );
  }

  return readSessionFromToken(read(SESSION_COOKIE));
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

/** 로그인이 심은 목 세션 쿠키를 되읽는다. 깨진 값은 게스트로 떨어뜨린다. */
export function readMockSessionCookie(value: string | undefined): Session | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as Partial<Session>;
    if (!parsed?.accountId || !parsed.role) return null;

    return {
      accountId: parsed.accountId,
      role: parsed.role,
      status: parsed.status ?? "ACTIVE",
      isNewUser: parsed.isNewUser ?? false,
      nickname: parsed.nickname ?? null,
    };
  } catch {
    return null;
  }
}

export function serializeMockSession(session: Session): string {
  return encodeURIComponent(JSON.stringify(session));
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
