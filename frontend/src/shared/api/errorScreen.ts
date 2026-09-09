import type { ApiError, ApiErrorKind } from "./ApiError";

/**
 * 조회 실패가 **어느 화면으로 떨어지는지** (11.2).
 *
 * `ApiErrorKind` 는 8종인데 화면은 2종이다 — **1:1 이 아니다.** 그 사실을 화면마다
 * 다시 판단하게 두면 언젠가 한 화면만 다르게 떨어진다. 여기 한 함수로 모으고,
 * `errorScreen.test.ts` 가 8종 × 2형태 = 16칸을 전부 적어 잠근다.
 *
 * ## 왜 404 가 `resource` 에 따라 갈리나
 *
 * `getDetail("없는-id")` 의 404 는 **"그 소개팅이 없다"** 는 뜻이라 재시도할 대상이
 * 아니다 — 없는 페이지(`not-found.tsx`)가 맞다. 반면 `getList` 의 404 는 결과 0건이
 * 아니라 **엔드포인트가 깨진 것**이다. 그걸 없는 페이지로 보내면 "조건에 맞는
 * 소개팅이 없어요"와 구분이 안 되고, 사용자는 서버 장애를 자기 필터 탓으로 읽는다.
 *
 * 그래서 판정에 필요한 것은 에러가 아니라 **무엇을 열려고 했는가**다.
 *
 * ## 재시도 가능 여부는 여기서 다시 정하지 않는다
 *
 * `ApiError.retryable` 이 이미 답을 들고 있다(NETWORK·TIMEOUT·SERVER 셋). 화면은
 * 그 값을 그대로 읽는다 — 같은 판정을 두 곳에 두면 언젠가 갈린다.
 */
export type ErrorScreenKind =
  /** 없는 페이지. `notFound()` 를 불러 `not-found.tsx` 로 간다 */
  | "notFound"
  /** 11.2 의 에러 카드. 오류 코드·발생 시각을 노출하고, `retryable` 이면 재시도를 준다 */
  | "errorCard";

/**
 * 조회의 성격.
 *
 * - `single` — 자원 **하나**를 여는 조회 (`getDetail`)
 * - `collection` — 목록·집계 조회 (`getList` · `getHomeFeed` · `exploreFacets`)
 */
export type ApiResourceShape = "single" | "collection";

export function errorScreen(
  error: Pick<ApiError, "kind">,
  resource: ApiResourceShape,
): ErrorScreenKind {
  return isMissingResource(error.kind, resource) ? "notFound" : "errorCard";
}

function isMissingResource(kind: ApiErrorKind, resource: ApiResourceShape): boolean {
  return kind === "NOT_FOUND" && resource === "single";
}
