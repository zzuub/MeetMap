"use client";

import type { ReactNode } from "react";
import { recentKeywordsStore } from "../model/recentKeywordsStore";

/**
 * 결과 카드를 누르면 **그 결과를 만든 검색어**를 최근 검색어에 남긴다 (`decisions.md` 4.69).
 *
 * 카드마다 핸들러를 달지 않고 목록을 한 번 감싼다 — 카드는 서버에서 그리고 링크는
 * `CardTitle` 의 stretched link 다. 하트(`button`)는 링크가 아니라 남기지 않는다.
 */
export function RememberOnResultClick({
  keyword,
  children,
}: {
  keyword: string;
  children: ReactNode;
}) {
  return (
    <div
      onClick={(event) => {
        if (isResultLinkClick(event.target)) recentKeywordsStore.remember(keyword);
      }}
    >
      {children}
    </div>
  );
}

/**
 * 클릭이 카드 링크(`a[href]`)에서 올라왔는가. 떼어 둔 것은 테스트가 **가짜 대상**으로
 * 부르기 위해서다 — jsdom 없이 (4.10 · 4.61 P2-9 표).
 */
export function isResultLinkClick(target: EventTarget | null): boolean {
  const element = target as Partial<Pick<Element, "closest">> | null;
  return typeof element?.closest === "function" && element.closest("a[href]") !== null;
}
