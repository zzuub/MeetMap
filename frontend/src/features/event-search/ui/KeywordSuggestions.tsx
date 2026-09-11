"use client";

import { SEARCH_COPY } from "../model/copy";
import { useSearchScreen } from "./SearchProvider";

/**
 * 결과 없음의 추천 검색어 칩 (11.1 · 11.2) — 훅이 없는 쪽. 내용은 인기 검색어에서 온다
 * (`suggestKeywords` · `decisions.md` 4.68). 비면 머리까지 통째로 그리지 않는다.
 *
 * `Chip` 을 쓰지 않는다 — 그 컴포넌트는 선택 칩이라 `aria-pressed="false"` 를 붙이는데,
 * 이 칩은 켜고 끄는 것이 아니라 누르면 검색하는 버튼이다.
 */
export function KeywordSuggestionsView({
  keywords,
  onChoose,
}: {
  keywords: readonly string[];
  onChoose: (keyword: string) => void;
}) {
  if (keywords.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-2.5">
      <p className="text-[12px] font-bold text-primary">{SEARCH_COPY.suggestionsTitle}</p>
      <ul className="flex flex-wrap justify-center gap-2">
        {keywords.map((keyword) => (
          <li key={keyword}>
            <button
              type="button"
              onClick={() => onChoose(keyword)}
              className="inline-flex min-h-11 items-center rounded-chip border border-border bg-surface px-3.5 text-[12.5px] font-semibold text-text hover:bg-accent-soft"
            >
              {keyword}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function KeywordSuggestions({ keywords }: { keywords: readonly string[] }) {
  const { choose } = useSearchScreen();
  return <KeywordSuggestionsView keywords={keywords} onChoose={choose} />;
}
