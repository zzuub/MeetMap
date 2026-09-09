import { notFound } from "next/navigation";
import type { ApiError, ApiErrorKind } from "../api/ApiError";
import { errorScreen, type ApiResourceShape } from "../api/errorScreen";
import { RetryErrorCard } from "./RetryErrorCard";

/**
 * 조회가 실패했을 때 화면이 그리는 것 (11.2 에러 카드).
 *
 * **`error.tsx` 가 이 자리를 대신할 수 없다.** 그쪽은 클라이언트 컴포넌트라
 * 프로덕션에서 서버 에러의 `message` 를 못 보고 `ApiError` 의 `code`·`occurredAt`·
 * `retryable` 도 경계를 못 넘는다 — 11.2 가 요구하는 **오류 코드와 발생 시각**이
 * 통째로 사라진다. 그래서 조회 실패는 **페이지가 잡아** 서버에서 이 카드를 그리고,
 * `error.tsx` 는 그 밖의 예외만 받는다 (`decisions.md` 4.40).
 *
 * 여기서 넘기는 값은 전부 원시값·`Date` 다 — `ApiError` 인스턴스 자체는 RSC 경계를
 * 못 넘는다.
 */
export function ApiErrorScreen({
  error,
  resource,
}: {
  error: ApiError;
  /** 자원 하나를 여는 조회인지 목록·집계인지. 404 의 뜻이 갈린다 */
  resource: ApiResourceShape;
}) {
  if (errorScreen(error, resource) === "notFound") notFound();

  const { title, description } = ERROR_COPY[error.kind];

  return (
    <RetryErrorCard
      title={title}
      description={description}
      code={error.code}
      occurredAt={error.occurredAt}
      // 재시도 판정은 `ApiError` 가 이미 들고 있다 — 여기서 다시 정하지 않는다
      retry={error.retryable ? "refresh" : false}
    />
  );
}

/**
 * 실패 종류별 문구.
 *
 * 11.2 는 **네트워크 오류 한 줄만** 정의했다. 그 문구를 8종 전부에 쓰면 403 을 받은
 * 사용자가 자기 와이파이를 확인하게 된다 — 틀린 안내는 안내가 없는 것보다 나쁘다.
 * 그래서 세 갈래로만 나눈다. `Record<ApiErrorKind, …>` 라 **종류가 늘면 컴파일
 * 에러**로 문구를 요구한다.
 */
const NETWORK_COPY = {
  // 11.2 표의 문구 그대로다
  title: "연결이 불안정해요",
  description: "네트워크 상태를 확인한 뒤 다시 시도해주세요",
};

const UNEXPECTED_COPY = {
  title: "정보를 불러오지 못했어요",
  description: "잠시 후 다시 들어와 주세요. 문제가 계속되면 아래 코드로 문의해주세요",
};

export const ERROR_COPY: Record<
  ApiErrorKind,
  { title: string; description: string }
> = {
  NETWORK: NETWORK_COPY,
  TIMEOUT: NETWORK_COPY,

  // 사용자의 연결 문제가 아니다 — 확인하라고 하면 엉뚱한 곳을 보게 된다
  SERVER: {
    title: "잠시 문제가 생겼어요",
    description: "서버 상태를 확인하고 있어요. 잠시 후 다시 시도해주세요",
  },

  // 재시도해도 같은 답이 오는 실패들. `retryable` 이 거짓이라 버튼도 안 뜬다
  UNAUTHORIZED: UNEXPECTED_COPY,
  FORBIDDEN: UNEXPECTED_COPY,
  CLIENT: UNEXPECTED_COPY,
  PARSE: UNEXPECTED_COPY,
  // 목록 조회의 404. 자원 하나를 여는 조회였다면 위에서 `notFound()` 로 빠졌다
  NOT_FOUND: UNEXPECTED_COPY,
};
