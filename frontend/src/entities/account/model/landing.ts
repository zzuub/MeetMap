import type { Session } from "./types";

/**
 * 로그인 뒤 어디로 보낼지 (3.1 / dev-plan 3.5).
 *
 * 두 가지를 여기 한 곳에 모은다.
 * 1. **`isNewUser` 판정** — 신규는 약관, 기존은 원래 가려던 곳. 화면마다 다시
 *    판정하지 않는다. 이 함수를 부르는 자리는 로그인 액션 **하나**다.
 * 2. **`?redirect=` 검증** — `proxy.ts` 가 붙여 보내는 값이라 사용자가 손으로도
 *    고칠 수 있다. 검증 없이 이동하면 오픈 리다이렉트다 (`decisions.md` 4.45).
 */

export const ONBOARDING_ROOT = "/onboarding";

/** 온보딩 퍼널 5화면. 순서가 곧 3.1~3.5 다. */
export const ONBOARDING_STEPS = {
  login: ONBOARDING_ROOT,
  terms: "/onboarding/terms",
  intro: "/onboarding/intro",
  profile: "/onboarding/profile",
  done: "/onboarding/done",
} as const;

/**
 * 퍼널을 마친 뒤 가는 곳.
 *
 * 3.5 는 **위치 권한 화면(4장)을 거쳐** 홈이라고 적었지만 그 화면은 P2-6 이다.
 * 목적지 없는 링크를 만들지 않으므로(4.29) 지금은 홈으로 직행하고, **P2-6 이
 * 이 상수 하나를 `/onboarding/location` 으로 바꾼다.**
 */
export const AFTER_ONBOARDING = "/";

/** `safeRedirect` 가 파싱에만 쓰는 가짜 오리진. 밖으로 나가지 않는다. */
const PROBE_ORIGIN = "http://meetmap.invalid";

/** 비정상적으로 긴 값은 파싱하기 전에 버린다. */
const MAX_REDIRECT_LENGTH = 512;

/** 제어문자·개행. 파싱기마다 해석이 갈리는 입력이라 받지 않는다. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

/**
 * 앱 내부 경로로만 이동을 허용한다. 통과하지 못하면 `null`.
 *
 * 막는 것을 열거하지 않고 **허용 조건을 좁게 적는다** — `https://evil.com`,
 * `//evil.com`, `/\evil.com`, `javascript:...` 가 전부 "첫 글자가 `/` 이고 둘째
 * 글자가 `/`·`\` 가 아니며 파싱 후 오리진이 그대로인가" 하나에 걸린다.
 *
 * 온보딩 경로를 제외하는 것은 보안이 아니라 **루프 방지**다. 게스트가
 * `/onboarding/profile` 을 손으로 치면 가드가 `?redirect=/onboarding/profile` 을
 * 달아 로그인으로 보내는데, 그대로 돌려보내면 같은 자리로 되돌아온다.
 */
export function safeRedirect(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;
  if (raw.length === 0 || raw.length > MAX_REDIRECT_LENGTH) return null;
  if (CONTROL_CHARS.test(raw)) return null;
  if (raw[0] !== "/") return null;
  if (raw[1] === "/" || raw[1] === "\\") return null;

  let url: URL;
  try {
    url = new URL(raw, PROBE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PROBE_ORIGIN) return null;

  if (
    url.pathname === ONBOARDING_ROOT ||
    url.pathname.startsWith(`${ONBOARDING_ROOT}/`)
  ) {
    return null;
  }

  return `${url.pathname}${url.search}`;
}

/**
 * 로그인 직후의 목적지 (3.1).
 *
 * ⚠️ **신규 가입자에게는 `redirect` 를 적용하지 않는다.** 3.5 가 퍼널의 끝을
 * 못 박아 두었고, 값을 5화면 너머로 나르려면 단계마다 URL 에 상태가 붙어
 * 새로고침·뒤로가기마다 유실 검사가 생긴다. 근거는 `decisions.md` 4.45.
 */
export function signInLanding(
  session: Session,
  redirect: string | null | undefined,
): string {
  if (session.isNewUser) return ONBOARDING_STEPS.terms;
  return safeRedirect(redirect) ?? AFTER_ONBOARDING;
}
