import { emptyResultTitle } from "@/features/event-search";
import { Numeric } from "@/shared/ui";

export type SearchStatusState =
  | { kind: "idle" }
  | { kind: "failed" }
  | { kind: "empty"; keyword: string }
  | { kind: "results"; count: number };

/**
 * 검색 결과를 **스크린리더에 알리는 자리** (15장). 입력이 멈추면 결과가 조용히 바뀌어
 * 보는 사람만 안다. 결과가 있으면 11.1 의 `검색 결과 N건` 줄로 보이고, 나머지는 가린다.
 *
 * ⚠️ **페이지의 모든 분기가 이것을 맨 앞에 둔다.** 상태가 바뀌어도 같은 자리의 같은
 * 요소여야 바뀐 글자가 읽힌다 — 새로 끼운 live region 은 안 읽히는 경우가 있다(`Toast`
 * 가 영역을 늘 남겨 두는 것과 같은 이유). 실패는 에러 카드의 `role="alert"` 가 알린다.
 */
export function SearchStatus({ state }: { state: SearchStatusState }) {
  return (
    <p
      role="status"
      className={state.kind === "results" ? "px-5 pt-3 text-[12.5px] text-text-sub" : "sr-only"}
    >
      {state.kind === "results" ? (
        <>
          검색 결과 <Numeric className="font-bold text-text">{state.count}</Numeric>건
        </>
      ) : state.kind === "empty" ? (
        emptyResultTitle(state.keyword)
      ) : null}
    </p>
  );
}
