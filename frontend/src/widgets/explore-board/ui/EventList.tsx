"use client";

import { useState } from "react";
import {
  EventCard,
  eventApi,
  type EventCardViewer,
  type EventListQuery,
  type EventSummary,
} from "@/entities/event";
import { toApiError, type ApiError, type CursorPage } from "@/shared/api";
import { ERROR_COPY, ErrorState, PrimaryButton } from "@/shared/ui";

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
 *
 * ⚠️ **이 화면은 실패 표면이 둘이다.** 첫 페이지는 서버에서 실패해 페이지가 잡고
 * (`loadOrError` → `ApiErrorScreen`), 이어붙이기는 **여기 클라이언트에서** 실패한다.
 * 후자도 11.2 를 지킨다 — 코드·발생 시각을 노출하고 `retryable` 로 재시도를 정한다
 * (`decisions.md` 4.40).
 */
export function EventList({ initial, query, viewer }: EventListProps) {
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  /**
   * ⚠️ **실패를 먼저 지우지 않는다.** 재시도 시작에 `setError(null)` 을 하면 에러
   * 카드가 사라졌다가 다시 나타나 화면이 한 번 튄다. 카드를 남겨 두면 `ErrorState`
   * 가 자기 버튼 라벨을 `다시 시도하는 중...` 으로 바꾼다 — 11.2 가 적은 그 패턴이다.
   */
  async function loadMore() {
    setLoading(true);
    try {
      const next = await eventApi.getList({ ...query, cursor });
      setItems((prev) => [...prev, ...next.items]);
      setCursor(next.nextCursor);
      setError(null);
    } catch (caught) {
      // 이미 본 카드는 남긴다. 전체를 에러 카드로 갈아끼우면 사용자가 방금 읽던
      // 목록이 사라진다 — 실패한 것은 **다음 장**뿐이다.
      setError(toApiError(caught));
    } finally {
      setLoading(false);
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

      <LoadMoreFooter
        error={error}
        cursor={cursor}
        loading={loading}
        onLoadMore={loadMore}
      />
    </>
  );
}

/**
 * 목록 아래 한 자리 — `더 보기` / 실패 / 아무것도 없음.
 *
 * 셋이 같은 자리를 쓰므로 한 컴포넌트가 고른다. 실패 상태에서 `더 보기` 를 함께
 * 두지 않는 이유는 아래 `LoadMoreError` 를 보라.
 */
function LoadMoreFooter({
  error,
  cursor,
  loading,
  onLoadMore,
}: {
  error: ApiError | null;
  cursor: string | null;
  loading: boolean;
  onLoadMore: () => Promise<void>;
}) {
  if (error !== null) {
    return <LoadMoreError error={error} onRetry={onLoadMore} />;
  }

  if (cursor === null) return null;

  return (
    <PrimaryButton
      variant="secondary"
      className="mt-4"
      disabled={loading}
      onClick={onLoadMore}
    >
      {loading ? "불러오는 중…" : "더 보기"}
    </PrimaryButton>
  );
}

/**
 * 증분 로딩 실패 (11.2).
 *
 * **`ApiErrorScreen` 과 같은 규칙을 쓰되 화면을 갈아끼우지 않는다** — 코드·발생
 * 시각을 노출하고, 재시도 버튼은 `ApiError.retryable` 이 정한다. 403·400 에서
 * `다시 시도` 를 계속 띄우는 것은 에러 카드가 피하려던 바로 그 거짓 희망이다.
 *
 * ⚠️ **재시도 불가 실패에서는 `더 보기` 도 사라진다.** 다음 장을 받을 방법이 실제로
 * 없기 때문이다 — 버튼만 남겨 두면 눌러도 같은 실패가 반복된다. 조건을 바꾸거나
 * 새로고침하는 것이 남은 길이고, 그 둘은 상단 컨트롤에 있다.
 *
 * 테스트가 직접 부를 수 있게 내보낸다 — 이 실패는 클릭 뒤 비동기로만 도달해서
 * 정적 렌더로는 `EventList` 를 통해 만들어낼 수 없다 (`decisions.md` 4.39 와 같은 수법).
 */
export function LoadMoreError({
  error,
  onRetry,
}: {
  error: ApiError;
  onRetry: () => void | Promise<void>;
}) {
  const { title, description } = ERROR_COPY[error.kind];

  return (
    <ErrorState
      className="mt-4"
      title={title}
      description={description}
      code={error.code}
      occurredAt={error.occurredAt}
      onRetry={error.retryable ? onRetry : undefined}
    />
  );
}
