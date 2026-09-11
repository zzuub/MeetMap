import { EventCardSkeletonList } from "@/entities/event";
import { Skeleton } from "@/shared/ui";

/** 찜 목록 로딩 (11.3). 개수 줄 + `liked` 카드 — 진짜 목록과 같은 높이로 선다 */
export function LikedListSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <Skeleton className="h-4 w-28 rounded-chip" />
      <EventCardSkeletonList variant="liked" count={3} />
    </div>
  );
}
