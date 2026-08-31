/**
 * 정규화된 API 에러.
 *
 * 11.2의 에러 카드는 **오류 코드와 발생 시각을 화면에 노출**한다. CS 문의 시
 * 식별자로 쓰기 때문에, 어떤 실패든 이 형태로 수렴시켜야 한다.
 * `fetch` 가 던지는 raw 예외를 화면까지 흘려보내지 않는다.
 */
export type ApiErrorKind =
  | "NETWORK" // 연결 실패 / DNS / offline
  | "TIMEOUT" // 요청 시간 초과
  | "UNAUTHORIZED" // 401 — 로그인 필요
  | "FORBIDDEN" // 403 — 권한 부족 (역할·승인 상태 불일치)
  | "NOT_FOUND" // 404
  | "SERVER" // 5xx
  | "CLIENT" // 그 외 4xx
  | "PARSE"; // 응답 본문 해석 실패

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** 화면에 노출되는 식별자. 예: `NET_TIMEOUT_504` */
  readonly code: string;
  readonly status: number | null;
  readonly occurredAt: Date;
  readonly detail?: unknown;

  constructor(params: {
    kind: ApiErrorKind;
    code: string;
    status?: number | null;
    message: string;
    detail?: unknown;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.kind = params.kind;
    this.code = params.code;
    this.status = params.status ?? null;
    this.occurredAt = new Date();
    this.detail = params.detail;
  }

  /** 재시도 버튼을 보여줄 만한 실패인가 (11.2) */
  get retryable(): boolean {
    return (
      this.kind === "NETWORK" || this.kind === "TIMEOUT" || this.kind === "SERVER"
    );
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}

/** 알 수 없는 예외를 ApiError 로 끌어올린다. catch 블록의 마지막 방어선. */
export function toApiError(error: unknown): ApiError {
  if (isApiError(error)) return error;

  return new ApiError({
    kind: "NETWORK",
    code: "NET_UNKNOWN",
    message: error instanceof Error ? error.message : "알 수 없는 오류",
    detail: error,
  });
}
