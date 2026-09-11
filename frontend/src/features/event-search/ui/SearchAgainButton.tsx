"use client";

import { PrimaryButton } from "@/shared/ui";
import { SEARCH_COPY } from "../model/copy";
import { useSearchScreen } from "./SearchProvider";

/**
 * `다시 검색하기` (11.2) — 검색어를 비우고(`idle` 의 최근·인기 검색어로) 입력창에 포커스한다.
 * 헤더 ✕ 와 같은 일을 0건 화면 가운데서 준다 (`decisions.md` 4.68).
 */
export function SearchAgainButton() {
  const { clear } = useSearchScreen();

  return (
    <PrimaryButton variant="secondary" onClick={clear}>
      {SEARCH_COPY.searchAgain}
    </PrimaryButton>
  );
}
