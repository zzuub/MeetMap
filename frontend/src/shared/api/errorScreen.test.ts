import { describe, expect, it } from "vitest";
import { ApiError, type ApiErrorKind } from "./ApiError";
import {
  errorScreen,
  type ErrorScreenKind,
  type ApiResourceShape,
} from "./errorScreen";

/**
 * **8종을 전부 적는다.** 지난 PR 들에서 방어선이 반복해 뚫린 이유가 "떠올린 경우만
 * 확인한 것"이라, 여기서는 표를 `Record<ApiErrorKind, …>` 로 잡는다 — 종류가 하나
 * 늘면 이 파일이 **컴파일 에러**로 새 줄을 요구한다. 잊어서 빠지는 경로가 없다.
 *
 * 표가 말하는 것: **`kind` 8종 : 화면 2종은 1:1 이 아니다.** 갈리는 칸은 딱 하나
 * (`NOT_FOUND` × `single`)이고, 나머지 15칸은 전부 에러 카드다. 카드 안에서 다시
 * 갈리는 축은 `retryable` 하나뿐이다.
 */

interface Row {
  /** 자원 하나를 여는 조회(`getDetail`)에서 났을 때 */
  single: ErrorScreenKind;
  /** 목록·집계 조회에서 났을 때 */
  collection: ErrorScreenKind;
  /** 에러 카드에 `다시 시도` 를 그리는가 (`ApiError.retryable`) */
  retryable: boolean;
}

const TABLE: Record<ApiErrorKind, Row> = {
  NETWORK: { single: "errorCard", collection: "errorCard", retryable: true },
  TIMEOUT: { single: "errorCard", collection: "errorCard", retryable: true },
  SERVER: { single: "errorCard", collection: "errorCard", retryable: true },

  // 401·403 을 로그인/권한 화면으로 보내지 않는다 — 로그인은 아직 자리표시자다
  // (P2-1). 누르면 🚧 로 가는 버튼을 만들지 않는다 → `decisions.md` 4.40
  UNAUTHORIZED: { single: "errorCard", collection: "errorCard", retryable: false },
  FORBIDDEN: { single: "errorCard", collection: "errorCard", retryable: false },

  // 같은 요청을 다시 보내도 같은 응답이 온다. 재시도 버튼은 거짓 희망이다
  CLIENT: { single: "errorCard", collection: "errorCard", retryable: false },
  PARSE: { single: "errorCard", collection: "errorCard", retryable: false },

  // 유일하게 갈리는 칸
  NOT_FOUND: { single: "notFound", collection: "errorCard", retryable: false },
};

const KINDS = Object.keys(TABLE) as ApiErrorKind[];

function makeError(kind: ApiErrorKind): ApiError {
  return new ApiError({ kind, code: `TEST_${kind}`, message: kind });
}

describe("조회 실패 → 화면", () => {
  it("8종을 전부 다룬다 (표가 비어 있지 않다)", () => {
    expect(KINDS).toHaveLength(8);
  });

  for (const kind of KINDS) {
    const row = TABLE[kind];

    for (const resource of ["single", "collection"] as ApiResourceShape[]) {
      it(`${kind} × ${resource} → ${row[resource]}`, () => {
        expect(errorScreen(makeError(kind), resource)).toBe(row[resource]);
      });
    }

    it(`${kind} 의 재시도 노출은 ${row.retryable}`, () => {
      expect(makeError(kind).retryable).toBe(row.retryable);
    });
  }

  it("없는 페이지로 가는 칸은 `NOT_FOUND × single` 하나뿐이다", () => {
    const notFoundCells = KINDS.flatMap((kind) =>
      (["single", "collection"] as ApiResourceShape[])
        .filter((resource) => errorScreen(makeError(kind), resource) === "notFound")
        .map((resource) => `${kind}/${resource}`),
    );

    expect(notFoundCells).toEqual(["NOT_FOUND/single"]);
  });
});
