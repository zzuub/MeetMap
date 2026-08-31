import { NextResponse, type NextRequest } from "next/server";
import {
  MOCK_ROLE_COOKIE,
  SESSION_COOKIE,
  checkAccess,
  readMockSession,
  readSessionFromToken,
} from "@/entities/account";
import { USE_MOCK } from "@/shared/config";

/**
 * 라우트 가드 (dev-plan 3.5 / P0-7).
 *
 * Next.js 16에서 `middleware` 규약은 **`proxy` 로 이름이 바뀌었다.**
 * `middleware.ts` 를 만들지 않는다.
 *
 * ⚠️ **이것은 UX 가드이지 보안 경계가 아니다.** 여기서 하는 일은 "권한 없는 사용자를
 * 로그인/안내 화면으로 보내는 것"뿐이다. 토큰 서명을 검증하지 않으므로, 실제 권한은
 * API 서버가 매 요청 재검증해야 한다. 이 파일을 통과했다는 사실에 기대어
 * 데이터 접근을 허용하는 백엔드 코드를 쓰지 않는다.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  const session = USE_MOCK
    ? readMockSession(request.cookies.get(MOCK_ROLE_COOKIE)?.value)
    : readSessionFromToken(request.cookies.get(SESSION_COOKIE)?.value);

  const decision = checkAccess(pathname, session);
  if (decision.allowed) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = decision.redirectTo;
  url.search = "";

  // 로그인 후 원래 가려던 곳으로 돌려보낸다 (3.5).
  if (decision.reason === "UNAUTHENTICATED") {
    url.searchParams.set("redirect", `${pathname}${search}`);
  }

  return NextResponse.redirect(url);
}

export const config = {
  // 정적 자산·API 프록시·이미지 최적화 경로는 건너뛴다.
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|mock|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)",
  ],
};
