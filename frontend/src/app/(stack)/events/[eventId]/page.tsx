import { notFound } from "next/navigation";
import { eventApi, type EventDetail } from "@/entities/event";
import { isApiError } from "@/shared/api";
import { AppHeader } from "@/widgets/app-header";
import { EventDetailView, ShareButton } from "@/widgets/event-detail";

/**
 * 소개팅 상세 `/events/[eventId]` (7.1·7.2). **카드 5종이 전부 여기로 온다.**
 *
 * 헤더에 타이틀을 주지 않는다 — 액션은 `공유` 뿐이고 소개팅명은 히어로의 `h1` 이다.
 * `(stack)/layout.tsx` 가 예고한 겹침 헤더는 스크롤 리스너가 필요해 통상 배치로 둔다.
 */
export default async function EventDetailPage({
  params,
}: {
  // Next 16 에서 Promise 다 (session-handoff 4장)
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const event = await getDetailOrNotFound(eventId);

  return (
    <>
      <AppHeader action={<ShareButton title={event.title} />} />
      <EventDetailView event={event} />
    </>
  );
}

/**
 * 404 만은 **에러 카드가 아니라 없는 페이지**다 — 재시도 버튼을 줄 대상이 아니다.
 * 나머지(네트워크·5xx)는 올려 `error.tsx` 가 받는다. 둘 다 P1-9 라 지금은 Next 기본이다.
 */
async function getDetailOrNotFound(id: string): Promise<EventDetail> {
  try {
    return await eventApi.getDetail(id);
  } catch (error) {
    if (isApiError(error) && error.kind === "NOT_FOUND") notFound();
    throw error;
  }
}
