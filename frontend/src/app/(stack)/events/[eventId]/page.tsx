import { eventApi } from "@/entities/event";
import { LikeProvider, toggleLikeAction } from "@/features/event-like";
import { loadOrError } from "@/shared/api";
import { ApiErrorScreen } from "@/shared/ui";
import { AppHeader } from "@/widgets/app-header";
import { EventDetailView, ShareButton } from "@/widgets/event-detail";
import { loadViewerContext, signInHrefFor } from "../../../_lib/viewer";

/**
 * 소개팅 상세 `/events/[eventId]` (7.1·7.2). **카드 5종이 전부 여기로 온다.**
 *
 * 헤더에 타이틀을 주지 않는다 — 액션은 `공유` 뿐이고 소개팅명은 **히어로의 `h1`** 이다
 * (타이틀 없는 `AppHeader` 를 쓰는 화면이 지는 의무 — 4.34). `(stack)/layout.tsx` 가
 * 예고한 겹침 헤더는 스크롤 리스너가 필요해 통상 배치로 둔다.
 *
 * 실패는 둘로 갈린다 — **404 만 없는 페이지**(`not-found.tsx`)이고 나머지는 11.2 의
 * 에러 카드다. 그 판정은 `ApiErrorScreen` 이 `resource="single"` 로 한 번에 한다
 * (`shared/api/errorScreen.ts` 의 표).
 */
export default async function EventDetailPage({
  params,
}: {
  // Next 16 에서 Promise 다 (session-handoff 4장)
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const [{ session, likedIds }, detail] = await Promise.all([
    loadViewerContext(),
    loadOrError(() => eventApi.getDetail(eventId)),
  ]);

  if (!detail.ok) {
    return (
      <>
        <AppHeader />
        {/* 타이틀 없는 `AppHeader` 를 쓰는 화면의 의무 (4.34). 정상 경로의 `h1` 은 히어로가 진다 */}
        <h1 className="sr-only">소개팅 정보를 불러오지 못했어요</h1>

        <div className="px-5 py-16">
          <ApiErrorScreen error={detail.error} resource="single" />
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader action={<ShareButton title={detail.data.title} />} />
      <LikeProvider
        liked={likedIds}
        signInHref={signInHrefFor(session, `/events/${eventId}`)}
        toggleLike={toggleLikeAction}
      >
        <EventDetailView event={detail.data} />
      </LikeProvider>
    </>
  );
}
