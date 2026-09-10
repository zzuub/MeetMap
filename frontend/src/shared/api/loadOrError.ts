import { toApiError, type ApiError } from "./ApiError";

/**
 * 조회 결과 아니면 정규화된 실패.
 *
 * 화면이 **에러를 올려보내지 않고 직접 잡는** 이유는 11.2 다 — `error.tsx` 는
 * 클라이언트 컴포넌트라 프로덕션에서 `ApiError` 의 `code`·`occurredAt` 을 못 본다.
 * 그런데 매 페이지에 `try/catch` 를 적으면 `catch {}` 로 조용히 삼키는 변형이
 * 언젠가 섞인다. 잡는 방법을 한 형태로 굳힌다.
 */
export type Loaded<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/**
 * ⚠️ **`ApiError` 가 아닌 예외도 여기서 흡수된다** (`toApiError` 가 `NET_UNKNOWN` 으로
 * 끌어올린다). 그건 의도다 — 조회 한 번에 화면이 통째로 날아가는 것보다 카드 하나가
 * 낫다. 대신 화면 **밖**의 버그(렌더 중 예외)는 이 함수를 안 거치므로
 * `error.tsx` 가 그대로 받는다.
 */
export async function loadOrError<T>(run: () => Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, data: await run() };
  } catch (error) {
    return { ok: false, error: toApiError(error) };
  }
}
