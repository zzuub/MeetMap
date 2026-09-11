"use client";

import { IconButton } from "@/shared/ui";
import { SEARCH_COPY, removeRecentLabel } from "../model/copy";
import {
  recentKeywordsStore,
  type RecentKeywordsSnapshot,
} from "../model/recentKeywordsStore";
import { useSearchScreen } from "./SearchProvider";
import { useRecentKeywords } from "./useRecentKeywords";

interface RecentKeywordsViewProps {
  snapshot: RecentKeywordsSnapshot;
  onChoose: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  onClearAll: () => void;
}

/**
 * 최근 검색어 (11.1) — 훅이 없는 쪽. 스냅샷 셋을 그대로 그린다 (`decisions.md` 4.69).
 *
 * - `unknown`(서버 렌더 · 하이드레이션 전) — 제목과 **한 줄 높이의 빈 자리**만. 모르는
 *   것을 없다고 말하지 않고, 0건 문구로 바뀔 때 아래 인기 검색어가 밀리지 않게 한다
 * - `unavailable`(저장이 막혔다) — **섹션을 그리지 않는다.** 저장한 척하는 자리를 남기지 않는다
 * - `전체 삭제` 는 지울 것이 있을 때만 — 누르면 아무 일 없는 컨트롤을 만들지 않는다 (4.29)
 */
export function RecentKeywordsView({
  snapshot,
  onChoose,
  onRemove,
  onClearAll,
}: RecentKeywordsViewProps) {
  if (snapshot.status === "unavailable") return null;

  const keywords = snapshot.status === "ready" ? snapshot.keywords : null;

  return (
    <section className="flex flex-col gap-1">
      <div className="flex min-h-11 items-center justify-between">
        <h2 className="text-[15px] font-bold text-text">{SEARCH_COPY.recentTitle}</h2>
        {keywords !== null && keywords.length > 0 ? (
          <button
            type="button"
            onClick={onClearAll}
            className="min-h-11 rounded-chip px-2 text-[12px] text-text-sub hover:bg-accent-soft"
          >
            {SEARCH_COPY.recentClearAll}
          </button>
        ) : null}
      </div>

      {keywords === null ? (
        <div aria-hidden className="h-11" />
      ) : keywords.length === 0 ? (
        <p className="flex min-h-11 items-center text-[12.5px] text-text-sub">
          {SEARCH_COPY.recentEmpty}
        </p>
      ) : (
        // 칩은 가로 스크롤로 만들지 않는다 — `flex-wrap` (6.2 원칙)
        <ul className="flex flex-wrap gap-2">
          {keywords.map((keyword) => (
            <li
              key={keyword}
              className="flex items-center rounded-chip border border-border bg-surface"
            >
              <button
                type="button"
                onClick={() => onChoose(keyword)}
                className="min-h-11 max-w-[200px] truncate pr-0.5 pl-3.5 text-[12.5px] font-medium text-text"
              >
                {keyword}
              </button>
              <IconButton label={removeRecentLabel(keyword)} onClick={() => onRemove(keyword)}>
                <svg viewBox="0 0 12 12" className="size-2.5 text-text-sub" aria-hidden>
                  <path
                    d="M3 3l6 6M9 3l-6 6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** 칩을 누르면 재검색하고 맨 앞으로 간다 — 남기는 일은 `choose` 가 한다 */
export function RecentKeywords() {
  const snapshot = useRecentKeywords();
  const { choose } = useSearchScreen();

  return (
    <RecentKeywordsView
      snapshot={snapshot}
      onChoose={choose}
      onRemove={recentKeywordsStore.remove}
      onClearAll={recentKeywordsStore.clear}
    />
  );
}
