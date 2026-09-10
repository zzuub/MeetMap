// 서버 전용 모듈이다. `next/headers` 를 임포트하므로 클라이언트 컴포넌트에서
// 부르면 Next.js가 빌드 시점에 에러를 낸다.
import { cookies } from "next/headers";
import { USE_MOCK } from "@/shared/config";
import { readSession, SESSION_COOKIE } from "../model/session";
import type { Session } from "../model/types";

/**
 * 서버 컴포넌트에서 현재 세션을 읽는다.
 *
 * Next.js 16에서 `cookies()` 는 비동기다 — 동기 접근은 제거됐다.
 * **세션을 어느 쿠키에서 읽을지는 `readSession` 이 정한다.** 여기서 다시 판정하지 않는다.
 */
export async function getServerSession(): Promise<Session | null> {
  const store = await cookies();
  return readSession((name) => store.get(name)?.value);
}

/**
 * API 호출에 붙일 액세스 토큰. 목 모드에서는 항상 `null` 이다.
 *
 * ⚠️ **위 `getServerSession` 과 달리 여기에는 `USE_MOCK` 이 남아 있다.** 세션을
 * 어디서 읽을지가 아니라 **토큰을 밖으로 내보낼지**의 문제라 성격이 다르다 — 실
 * 모드에서 쓰던 `meetmap_at` 이 브라우저에 남은 채 목 모드로 내려오면, 목 구현이
 * 값을 무시한다는 사실에만 기대게 된다. 목 구현은 여럿이고 앞으로도 늘어난다.
 * 그래서 목 모드에서는 **토큰이 아예 만들어지지 않는다**는 것을 여기서 보장한다.
 */
export async function getAccessToken(): Promise<string | null> {
  if (USE_MOCK) return null;
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
