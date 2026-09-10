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
 * 목/실 분기는 `readSession` 안에 있다. 여기서 다시 판정하지 않는다.
 */
export async function getServerSession(): Promise<Session | null> {
  const store = await cookies();
  return readSession((name) => store.get(name)?.value);
}

/** API 호출에 붙일 액세스 토큰. 목 모드에서는 항상 `null` 이다. */
export async function getAccessToken(): Promise<string | null> {
  if (USE_MOCK) return null;
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}
