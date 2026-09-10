import { notFound } from "next/navigation";
import type { ApiError } from "../api/ApiError";
import { errorScreen, type ApiResourceShape } from "../api/errorScreen";
import { ERROR_COPY } from "./errorCopy";
import { RetryErrorCard } from "./RetryErrorCard";

/**
 * **화면 진입의** 조회가 실패했을 때 그리는 것 (11.2 에러 카드).
 *
 * `error.tsx` 가 이 자리를 대신할 수 없다. 그쪽은 클라이언트 컴포넌트라 프로덕션에서
 * 서버 에러의 `message` 를 못 보고 `ApiError` 의 `code`·`occurredAt`·`retryable` 도
 * 경계를 못 넘는다 — 11.2 가 요구하는 **오류 코드와 발생 시각**이 통째로 사라진다.
 * 그래서 조회 실패는 **페이지가 잡아** 서버에서 이 카드를 그리고, `error.tsx` 는
 * 그 밖의 예외만 받는다 (`decisions.md` 4.40).
 *
 * ⚠️ **목록의 증분 로딩(`더 보기`)은 여기로 오지 않는다.** 이미 그린 카드를 지우고
 * 전체를 에러로 바꾸면 안 되기 때문이다 — 그쪽은 `explore-board` 의 `LoadMoreError`
 * 가 같은 규칙(코드·시각·`retryable`)으로 목록 아래에 그린다.
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
