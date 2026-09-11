import { Skeleton } from "@/shared/ui";

/**
 * 검색 로딩 (11.3) — `idle` 모양이다. 앱 안에서 이 폴백을 밟는 길은 홈 헤더 → 검색이고
 * 그때는 검색어가 없다. 입력창은 레이아웃에 있어 여기서 그리지 않는다 — 조회를 기다리는
 * 동안에도 칠 수 있다 (`decisions.md` 4.66).
 */
export function SearchBoardSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-5 px-5 py-3">
      <div className="flex flex-col gap-1">
        <Skeleton className="my-3.5 h-4 w-20 rounded-chip" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-11 w-20 rounded-chip" />
          <Skeleton className="h-11 w-28 rounded-chip" />
          <Skeleton className="h-11 w-24 rounded-chip" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <Skeleton className="my-3.5 h-4 w-20 rounded-chip" />
        {/* 인기 검색어 6줄 — 한 줄 48px */}
        <Skeleton className="h-[288px] w-full" />
      </div>
    </div>
  );
}
