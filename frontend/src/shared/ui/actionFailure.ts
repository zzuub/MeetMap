import { toApiError } from "../api/ApiError";
import { ERROR_COPY } from "./errorCopy";

/**
 * Server Action 이 클라이언트로 돌려보내는 실패 (11.2 · `decisions.md` 4.46).
 *
 * **네 번째 실패 표면이다.** 앞의 셋(화면 진입의 조회 · 목록의 `더 보기` · 렌더 중
 * 예외 → 4.40)은 전부 읽기이고, 이것은 **쓰기**다. 다른 점은 하나: 실패해도
 * 화면을 갈아끼우지 않는다 — 사용자가 방금 채운 폼이 그대로 남아 있어야 다시
 * 누를 수 있다. 그래서 카드가 아니라 폼 안의 한 줄이다.
 *
 * 전부 평범한 값인 이유는 RSC 경계다 — `ApiError` 인스턴스는 넘어가지 못하고,
 * `occurredAt` 은 **실패한 시각**이라 클라이언트에서 다시 만들면 안 된다.
 */
export interface ActionFailure {
  /** 예: `NET_TIMEOUT_504`. CS 문의 식별자다 */
  code: string;
  /** ISO 8601. `ApiError.occurredAt` 을 그대로 옮긴 값이다 */
  occurredAt: string;
  title: string;
  description: string;
}

export function toActionFailure(error: unknown): ActionFailure {
  const api = toApiError(error);

  return {
    code: api.code,
    occurredAt: api.occurredAt.toISOString(),
    ...ERROR_COPY[api.kind],
  };
}
