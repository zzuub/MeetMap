"use client";

import { useState } from "react";
import {
  EventCard,
  eventApi,
  type EventCardViewer,
  type EventListQuery,
  type EventSummary,
} from "@/entities/event";
import type { CursorPage } from "@/shared/api";
import { PrimaryButton } from "@/shared/ui";

interface EventListProps {
  /** 서버가 그린 첫 페이지 */
  initial: CursorPage<EventSummary>;
  /** 다음 페이지를 같은 조건으로 이어받기 위해 그대로 들고 있는다 */
  query: EventListQuery;
  viewer: EventCardViewer | null;
}

/**
 * 리스트 + `더 보기` (6.5).
 *
 * 첫 페이지는 서버가 그리고, 이어붙이기만 클라이언트가 한다 — 커서를 그대로 쓰므로
 * 목/실 API 어느 쪽이든 같은 경로다. 무한 스크롤은 아직 TBD 라(16장) 버튼으로 둔다.
 *
 * **필터가 바뀌면 이 컴포넌트는 통째로 새로 만들어져야 한다.** 누적분이 남으면 이전
 * 조건의 카드가 섞인다 — 부모가 조건을 `key` 로 넘겨 그것을 보장한다.
 */
export function EventList({ initial, query, viewer }: EventListProps) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [state, setState] = useState<"idle" | "loading" | "failed">("idle");

  async function loadMore() {
    setState("loading");
    try {
      const next = await eventApi.getList({ ...query, cursor });
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.nextCursor);
      setState("idle");
    } catch {
      // 이미 본 카드는 남긴다. 재시도는 라벨이 안내한다 (2.5 비활성 버튼 패턴과 같은 결)
      setState("failed");
    }
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {items.map((event) => (
          <li key={event.id}>
            {/* 자격 필터를 끈 목록에서만 `내 나이대 아님` 이 붙는다 (6.4·6.5) */}
            <EventCard
              event={event}
              variant="list"
              viewer={viewer}
              eligibleOnly={query.eligibleOnly}
            />
          </li>
        ))}
      </ul>

      {cursor !== null ? (
        <PrimaryButton
          variant="secondary"
          className="mt-4"
          disabled={state === "loading"}
          onClick={loadMore}
        >
          {MORE_LABEL[state]}
        </PrimaryButton>
      ) : null}
    </>
  );
}

const MORE_LABEL = {
  idle: "더 보기",
  loading: "불러오는 중…",
  failed: "다시 시도",
} as const;
