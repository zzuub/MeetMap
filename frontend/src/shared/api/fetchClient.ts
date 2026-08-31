import { API_BASE_URL } from "../config/env";
import { ApiError, type ApiErrorKind } from "./ApiError";

const DEFAULT_TIMEOUT_MS = 10_000;

export interface FetchOptions extends Omit<RequestInit, "body"> {
  /** 쿼리스트링. `undefined`/`null` 값은 자동으로 빠진다. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** JSON 직렬화할 본문. `FormData` 등을 보내야 하면 `rawBody` 를 쓴다. */
  body?: unknown;
  rawBody?: BodyInit;
  /**
   * 타임아웃(ms). 서버 렌더에서는 **명시적으로 넘긴 경우에만** 적용된다.
   * 이유는 아래 주석 참고.
   */
  timeoutMs?: number;
  /** Bearer 토큰. 서버 컴포넌트에서 쿠키를 읽어 넘긴다. */
  accessToken?: string | null;
}

/**
 * 공통 fetch 클라이언트 (dev-plan P0-5).
 *
 * 책임은 셋뿐이다 — baseURL 결합, 인증 헤더 부착, **에러 정규화**.
 * 캐싱·재시도·상태관리는 여기서 하지 않는다. 그건 호출부(또는 서버 상태
 * 라이브러리)의 몫이다.
 *
 * ## 타임아웃 vs Next.js 요청 메모이제이션
 *
 * Next.js는 한 번의 서버 렌더 중 같은 URL·옵션의 GET `fetch` 를 자동으로
 * 메모이즈해서 한 번만 실행한다. 그런데 **`signal` 을 넘기면 이 메모이제이션이
 * 꺼진다**(Next 공식 문서: "To opt out, pass an AbortController signal").
 *
 * 타임아웃을 걸려면 `signal` 이 필요하므로 둘은 양립하지 않는다. 그래서
 * 실행 환경에 따라 다르게 판단한다.
 *
 * - **서버(SSR/RSC)**: 기본적으로 signal 을 붙이지 않는다. 레이아웃과 페이지가
 *   같은 데이터를 부를 때 중복 호출을 막는 쪽이 이득이 크고, 서버 측 타임아웃은
 *   인프라(게이트웨이) 레이어에서 거는 게 맞다.
 * - **브라우저**: 메모이제이션 대상이 아니므로 기본 타임아웃을 건다.
 *
 * 서버에서도 타임아웃이 꼭 필요하면 `timeoutMs` 를 명시적으로 넘긴다.
 * 그 순간 메모이제이션을 포기한다는 뜻이므로 의도가 코드에 드러난다.
 */
export async function fetchClient<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { query, body, rawBody, timeoutMs, accessToken, headers, ...init } =
    options;

  const url = buildUrl(path, query);

  const isBrowser = typeof window !== "undefined";
  const effectiveTimeout = timeoutMs ?? (isBrowser ? DEFAULT_TIMEOUT_MS : null);

  // signal 은 타임아웃을 실제로 걸 때만 만든다. 서버에서 무조건 붙이면
  // Next 의 요청 메모이제이션이 통째로 꺼진다.
  let controller: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;

  if (effectiveTimeout !== null) {
    controller = new AbortController();
    timer = setTimeout(() => controller?.abort(), effectiveTimeout);
  }

  const finalHeaders = new Headers(headers);
  if (accessToken) finalHeaders.set("Authorization", `Bearer ${accessToken}`);
  if (body !== undefined && !finalHeaders.has("Content-Type")) {
    finalHeaders.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: finalHeaders,
      body: rawBody ?? (body !== undefined ? JSON.stringify(body) : undefined),
      // undefined 를 넘기면 Next 는 signal 없는 요청으로 취급한다.
      signal: controller?.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError({
        kind: "TIMEOUT",
        code: "NET_TIMEOUT_504",
        message: "요청 시간이 초과되었습니다.",
      });
    }
    throw new ApiError({
      kind: "NETWORK",
      code: "NET_UNREACHABLE",
      message: "서버에 연결할 수 없습니다.",
      detail: error,
    });
  } finally {
    if (timer !== null) clearTimeout(timer);
  }

  if (!response.ok) {
    throw await buildHttpError(response);
  }

  if (response.status === 204) return undefined as T;

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError({
      kind: "PARSE",
      code: "RES_PARSE_FAILED",
      status: response.status,
      message: "응답을 해석할 수 없습니다.",
      detail: error,
    });
  }
}

/* ── 내부 ───────────────────────────────────────────────── */

function buildUrl(
  path: string,
  query?: FetchOptions["query"],
): string {
  const base = API_BASE_URL.replace(/\/$/, "");
  const suffix = path.startsWith("/") ? path : `/${path}`;
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const qs = search.toString();
  return `${base}${suffix}${qs ? `?${qs}` : ""}`;
}

async function buildHttpError(response: Response): Promise<ApiError> {
  const kind = kindFromStatus(response.status);
  let detail: unknown;
  let serverCode: string | undefined;

  try {
    const payload = (await response.json()) as { code?: string; message?: string };
    detail = payload;
    serverCode = payload?.code;
  } catch {
    // 본문이 비었거나 JSON이 아닌 경우. 상태 코드만으로 처리한다.
  }

  return new ApiError({
    kind,
    // 서버가 코드를 주면 그걸 쓰고, 아니면 상태 코드로 만든다.
    code: serverCode ?? `${kindPrefix(kind)}_${response.status}`,
    status: response.status,
    message: messageFromKind(kind),
    detail,
  });
}

function kindFromStatus(status: number): ApiErrorKind {
  if (status === 401) return "UNAUTHORIZED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status >= 500) return "SERVER";
  return "CLIENT";
}

function kindPrefix(kind: ApiErrorKind): string {
  switch (kind) {
    case "UNAUTHORIZED":
      return "AUTH";
    case "FORBIDDEN":
      return "PERM";
    case "NOT_FOUND":
      return "NOTFOUND";
    case "SERVER":
      return "SRV";
    default:
      return "REQ";
  }
}

function messageFromKind(kind: ApiErrorKind): string {
  switch (kind) {
    case "UNAUTHORIZED":
      return "로그인이 필요합니다.";
    case "FORBIDDEN":
      return "접근 권한이 없습니다.";
    case "NOT_FOUND":
      return "요청한 정보를 찾을 수 없습니다.";
    case "SERVER":
      return "서버에 문제가 발생했습니다.";
    default:
      return "요청을 처리하지 못했습니다.";
  }
}
