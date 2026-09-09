import { Skeleton } from "@/shared/ui";

/**
 * 상세 로딩 (11.3).
 *
 * **하단 고정 CTA 자리를 비워 둔다.** 본문이 `pb-[calc(var(--height-fixed-cta)+16px)]`
 * 로 그 높이를 피해 있으므로(7.2), 폴백이 그 여백을 안 주면 응답이 온 순간 본문
 * 길이가 바뀐다. 바 자체는 그리지 않는다 — 누를 수 있는 `신청하기` 가 로딩 중에
 * 떠 있으면 아직 오지 않은 회차로 외부 이동을 시도하게 된다 (7.3).
 */
export function EventDetailSkeleton() {
  return (
    <div className="pb-[calc(var(--height-fixed-cta)+16px)]" aria-busy>
      <span className="sr-only">소개팅 정보를 불러오는 중입니다</span>

      {/* 히어로 220px */}
      <Skeleton className="h-[220px] w-full rounded-none" />

      <div className="flex flex-col gap-2 px-5 pt-4">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-chip" />
          <Skeleton className="h-5 w-12 rounded-chip" />
        </div>
        <Skeleton className="h-6 w-4/5 rounded-chip" />
        <Skeleton className="h-4 w-3/5 rounded-chip" />
      </div>

      <div className="mt-6 flex flex-col gap-6 px-5">
        {/* 주최사 블록 */}
        <Skeleton className="h-[72px] w-full" />
        {/* 정보 카드 */}
        <Skeleton className="h-[168px] w-full" />
        {/* 장소 블록 */}
        <Skeleton className="h-[96px] w-full" />

        {/* 소개 */}
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-16 rounded-chip" />
          <Skeleton className="h-3.5 w-full rounded-chip" />
          <Skeleton className="h-3.5 w-full rounded-chip" />
          <Skeleton className="h-3.5 w-2/3 rounded-chip" />
        </div>
      </div>
    </div>
  );
}
