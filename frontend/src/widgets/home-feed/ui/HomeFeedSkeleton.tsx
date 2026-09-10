import { EventCardSkeleton } from "@/entities/event";
import { Skeleton } from "@/shared/ui";

/**
 * 홈 로딩 (11.3 `홈 → 카드 스켈레톤`).
 *
 * **`HomeFeed` 와 같은 파일 옆에 둔다.** 홈의 순서(헤드라인 → 프로모 → 섹션)가
 * 바뀌면 스켈레톤도 같이 바뀌어야 하는데, 스켈레톤이 `app/` 에 있으면 그 둘이
 * 서로를 못 보고 어긋난다.
 *
 * ⚠️ **섹션을 두 개만 그린다.** 섹션 B(`내 나이대`)는 로그인·프로필이 전제라
 * 게스트에게는 아예 없다(5.3). 셋을 그려두면 게스트가 매번 "사라지는 섹션"을 본다 —
 * 없는 것보다 나쁘다. 세 번째 자리는 실제로 세 섹션이 다 뜨는 사용자에게만
 * 잠깐 비는데, 그건 내용이 채워지는 방향이라 밀림이 아니다.
 */
export function HomeFeedSkeleton() {
  return (
    <div className="flex flex-col gap-7 px-5 py-4" aria-busy>
      <span className="sr-only">소개팅을 불러오는 중입니다</span>

      {/* 헤드라인 히어로 */}
      <Skeleton className="h-[122px] w-full" />

      {/* 지도 프로모 카드 */}
      <Skeleton className="h-[104px] w-full" />

      <CarouselSection />
      <ListSection />
    </div>
  );
}

function SectionHeader() {
  return (
    <div className="flex items-center justify-between gap-2">
      <Skeleton className="h-4 w-32 rounded-chip" />
      <Skeleton className="h-3 w-12 rounded-chip" />
    </div>
  );
}

/** 섹션 A — `feature` 가로 스크롤. 화면 폭(430px)에 두 장 남짓 보인다 */
function CarouselSection() {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader />
      <div className="-mx-5 flex gap-3 overflow-hidden px-5">
        {[0, 1, 2].map((index) => (
          <EventCardSkeleton key={index} variant="feature" />
        ))}
      </div>
    </section>
  );
}

/** 섹션 C — `compact` 세로 리스트 */
function ListSection() {
  return (
    <section className="flex flex-col gap-3">
      <SectionHeader />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3].map((index) => (
          <EventCardSkeleton key={index} variant="compact" />
        ))}
      </div>
    </section>
  );
}
