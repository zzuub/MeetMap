import { EventCard, type EventCardViewer, type EventSummary } from "@/entities/event";
import { LikeButton } from "@/features/event-like";
import { RememberOnResultClick } from "@/features/event-search";

/**
 * 결과 목록 (11.1) — `search` 카드(`decisions.md` 4.67).
 *
 * 순서는 서버가 정해 넘긴다(`orderUpcomingFirst` — 4.70). `LikeProvider` 는 페이지가 이
 * 목록 하나를 두른다(4.59). 칠하는 검색어는 **이 결과를 만든 것**(서버가 받은 `q`)이다 —
 * 타이핑 중인 입력창 글자가 아니다.
 */
export function SearchResults({
  events,
  keyword,
  viewer,
}: {
  events: readonly EventSummary[];
  keyword: string;
  viewer: EventCardViewer | null;
}) {
  return (
    <RememberOnResultClick keyword={keyword}>
      <ul aria-label="검색 결과" className="flex flex-col gap-2 px-5 pt-2 pb-6">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard
              event={event}
              variant="search"
              keyword={keyword}
              viewer={viewer}
              action={<LikeButton eventId={event.id} />}
            />
          </li>
        ))}
      </ul>
    </RememberOnResultClick>
  );
}
