"use client";

import {
  trendChange,
  trendChangeLabel,
  type TrendChange,
  type TrendingSnapshot,
} from "@/entities/search";
import { TRENDING_KEYWORDS_MAX } from "@/shared/config";
import { cn } from "@/shared/lib";
import { Numeric } from "@/shared/ui";
import { SEARCH_COPY, trendingBaseLabel } from "../model/copy";
import { useSearchScreen } from "./SearchProvider";

/** 오른 것·새로 든 것은 짙게, 내려간 것·그대로인 것은 옅게 (목업) */
const EMPHASIZED: ReadonlySet<TrendChange["kind"]> = new Set(["up", "new"]);

/**
 * 인기 검색어 Top 6 (11.1) — 훅이 없는 쪽.
 *
 * **순위는 배열 위치다**(계약 — `decisions.md` 4.68). 1~3위 숫자는 `--color-point`
 * (2.2 가 `인기랭킹 숫자` 를 그 색의 자리로 지목했다)이고 세리프다. 증감은 보이는 표기와
 * 별도로 스크린리더 문구를 준다 — `+2` 가 `플러스 2` 로, `—` 는 아예 안 읽힌다.
 */
export function TrendingKeywordsView({
  snapshot,
  onChoose,
}: {
  snapshot: TrendingSnapshot;
  onChoose: (keyword: string) => void;
}) {
  const rows = snapshot.keywords.slice(0, TRENDING_KEYWORDS_MAX);
  if (rows.length === 0) return null;

  return (
    <section className="flex flex-col gap-1">
      <div className="flex min-h-11 items-center justify-between">
        <h2 className="text-[15px] font-bold text-text">{SEARCH_COPY.trendingTitle}</h2>
        <p className="text-[11px] text-text-sub">{trendingBaseLabel(snapshot.baseAt)}</p>
      </div>

      <ol className="overflow-hidden rounded-card border border-border bg-surface">
        {rows.map((item, index) => {
          const rank = index + 1;
          const change = trendChange(rank, item.previousRank);
          const label = trendChangeLabel(change);

          return (
            <li key={item.keyword} className={cn(index > 0 && "border-t border-border/60")}>
              <button
                type="button"
                onClick={() => onChoose(item.keyword)}
                className="flex min-h-12 w-full items-center gap-3 px-4 text-left hover:bg-accent-soft"
              >
                <Numeric
                  className={cn(
                    "w-4 shrink-0 text-[14px] font-bold",
                    rank <= 3 ? "text-point" : "text-text-sub",
                  )}
                >
                  {rank}
                </Numeric>
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-text">
                  {item.keyword}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "shrink-0 text-[11px] font-semibold",
                    EMPHASIZED.has(change.kind) ? "text-primary" : "text-text-sub",
                  )}
                >
                  {label.text}
                </span>
                <span className="sr-only">{label.description}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** 누르면 입력창을 채우고 바로 검색한다 — 최근 검색어에도 남는다 (4.69) */
export function TrendingKeywords({ snapshot }: { snapshot: TrendingSnapshot }) {
  const { choose } = useSearchScreen();
  return <TrendingKeywordsView snapshot={snapshot} onChoose={choose} />;
}
