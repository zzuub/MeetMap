"use client";

import { EventCard, type EventCardViewer, type EventSummary } from "@/entities/event";
import { exploreHref } from "@/features/event-filter";
import { LikeButton, useLike } from "@/features/event-like";
import { ActionLink, EmptyState, Numeric } from "@/shared/ui";

/**
 * 찜 목록 본문 — `찜한 소개팅 N개` + 카드 / 빈 상태 (9장).
 *
 * ⚠️ **서버 prop 이 아니라 `LikeProvider` 의 낙관 상태로 거른다.** `즉시 제거`(9장)는
 * `revalidatePath` 로는 안 된다 — 서버가 다시 그릴 때까지 카드가 남는다. 개수·빈 상태도
 * 거른 뒤의 값을 센다 (`decisions.md` 4.64).
 */
export function LikedList({
  events,
  viewer,
}: {
  /** 서버가 정렬해 넘긴 찜한 회차 (`orderLikedEvents`) */
  events: readonly EventSummary[];
  viewer: EventCardViewer | null;
}) {
  const { isLiked } = useLike();
  const visible = events.filter((event) => isLiked(event.id));

  if (visible.length === 0) return <LikedEmpty />;

  return (
    <div className="flex flex-col gap-3 px-5 py-4">
      <p className="text-[13px] text-text-sub">
        찜한 소개팅 <Numeric className="font-bold text-text">{visible.length}</Numeric>개
      </p>

      <ul aria-label="찜한 소개팅" className="flex flex-col gap-2">
        {visible.map((event) => (
          <li key={event.id}>
            <EventCard
              event={event}
              variant="liked"
              viewer={viewer}
              action={<LikeButton eventId={event.id} />}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 조건 없는 탐색. 주소는 손으로 만들지 않는다 (4.24) */
const EXPLORE_DEFAULT = exploreHref({ view: "list", query: {} });

/**
 * 빈 상태 (9장 · 11.2). ⚠️ 9장 원문의 `동그라미` 를 `하트` 로 바꿨다 — 찜 버튼은 하트다
 * (`spec/14-open-items.md` 사양 문서 갱신 대기).
 */
function LikedEmpty() {
  return (
    <EmptyState
      icon="🤍"
      title="아직 찜한 소개팅이 없어요"
      description="마음에 드는 소개팅의 하트를 누르면 여기에 저장돼요"
      action={<ActionLink href={EXPLORE_DEFAULT}>소개팅 탐색하러 가기</ActionLink>}
    />
  );
}
