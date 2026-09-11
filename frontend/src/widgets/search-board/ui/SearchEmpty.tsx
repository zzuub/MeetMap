import {
  KeywordSuggestions,
  SEARCH_COPY,
  SearchAgainButton,
  emptyResultTitle,
} from "@/features/event-search";
import { EmptyState } from "@/shared/ui";

/**
 * 결과 없음 (11.1 · 11.2).
 *
 * 추천 칩은 인기 검색어에서 오고(`decisions.md` 4.68), 비었거나 조회가 죽으면 칩 없이
 * `다시 검색하기` 만 남는다 — 11.2 의 `다음 행동을 제시한다` 는 그 버튼이 지킨다.
 */
export function SearchEmpty({
  keyword,
  suggestions,
}: {
  keyword: string;
  suggestions: readonly string[];
}) {
  return (
    <EmptyState
      icon="🔍"
      title={emptyResultTitle(keyword)}
      description={SEARCH_COPY.emptyDescription}
      action={
        <div className="flex flex-col items-center gap-5">
          <KeywordSuggestions keywords={suggestions} />
          <SearchAgainButton />
        </div>
      }
    />
  );
}
