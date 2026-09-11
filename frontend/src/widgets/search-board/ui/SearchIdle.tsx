import type { TrendingSnapshot } from "@/entities/search";
import { RecentKeywords, TrendingKeywords } from "@/features/event-search";

/**
 * `idle` — 최근 검색어 + 인기 검색어 (11.1).
 *
 * 인기 검색어가 `null` 이면(조회 실패) 그 섹션만 빠진다 — 입력창과 최근 검색어로 화면이
 * 성립한다 (`decisions.md` 4.68).
 */
export function SearchIdle({ trending }: { trending: TrendingSnapshot | null }) {
  return (
    <div className="flex flex-col gap-5 px-5 py-3">
      <RecentKeywords />
      {trending ? <TrendingKeywords snapshot={trending} /> : null}
    </div>
  );
}
