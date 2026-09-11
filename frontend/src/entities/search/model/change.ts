/** 인기 검색어의 순위 변화 (11.1 `+N / — / -N / new`) */
export type TrendChange =
  | { kind: "up"; by: number }
  | { kind: "down"; by: number }
  | { kind: "same" }
  | { kind: "new" };

/**
 * 직전 스냅샷 대비 순위 변화. `rank` 는 1부터이고, 계약이 순위를 배열 위치로 주므로
 * 호출부가 `index + 1` 을 넘긴다 (`decisions.md` 4.68).
 */
export function trendChange(rank: number, previousRank: number | null): TrendChange {
  if (previousRank === null) return { kind: "new" };

  const diff = previousRank - rank;
  if (diff > 0) return { kind: "up", by: diff };
  if (diff < 0) return { kind: "down", by: -diff };
  return { kind: "same" };
}

/**
 * 보이는 표기와 스크린리더 문구. 표기만 주면 `+2` 가 `플러스 2` 로, `—` 는 아예
 * 안 읽힌다 — 색으로만 구분하지 않는다는 15장 규칙의 글자판이다.
 */
export function trendChangeLabel(change: TrendChange): { text: string; description: string } {
  switch (change.kind) {
    case "up":
      return { text: `+${change.by}`, description: `${change.by}계단 상승` };
    case "down":
      return { text: `-${change.by}`, description: `${change.by}계단 하락` };
    case "same":
      return { text: "—", description: "순위 변동 없음" };
    case "new":
      return { text: "new", description: "새로 진입" };
  }
}
