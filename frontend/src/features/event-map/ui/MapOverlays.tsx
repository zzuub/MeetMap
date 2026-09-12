import { ActionLink, ErrorState } from "@/shared/ui";
import type { MapLoadFailure } from "../api/kakaoLoader";
import { MAP_FAILURE_COPY } from "../model/copy";

/**
 * 지도 로딩 오버레이 (11.3 `지도 → 지도 로딩 오버레이`).
 *
 * **서버 대기 · 청크 대기 · SDK 대기가 같은 상자에 같은 모양이다** — 탐색 스켈레톤(지도 뷰)
 * · `next/dynamic` 의 `loading` · 캔버스가 셋 다 이것을 그린다. 모양이 갈리면 기다리는 동안
 * 화면이 두 번 바뀐다.
 */
export function MapLoadingOverlay() {
  return (
    <div
      role="status"
      className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-bg"
    >
      <span aria-hidden className="size-10 animate-pulse rounded-chip bg-border" />
      <span className="text-[13px] text-text-sub">지도를 불러오는 중이에요</span>
    </div>
  );
}

/**
 * 지도를 못 띄웠을 때 (11.2 형태 · `decisions.md` 4.71).
 *
 * **지도 상자 안에만 그린다** — 조건을 거는 상단 컨트롤은 멀쩡하고, 실패한 것은 지도뿐이다
 * (`LoadMoreError` 가 목록 아래에만 그리는 것과 같은 결). 코드·발생 시각을 남기고 재시도는
 * `retryable` 이 정한다.
 *
 * `리스트로 보기` 는 **같은 조건의 리스트**다 — 지도가 못 뜨는 동안 같은 결과를 보는 길이라
 * 재시도가 없는 실패(키 없음)에도 나갈 길이 남는다 (11.2 · 4.42).
 */
export function MapFailure({
  failure,
  onRetry,
  listHref,
}: {
  failure: MapLoadFailure;
  onRetry: () => void;
  listHref: string;
}) {
  const { title, description } = MAP_FAILURE_COPY[failure.kind];

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-bg p-4">
      <ErrorState
        className="w-full"
        title={title}
        description={description}
        code={failure.code}
        occurredAt={failure.occurredAt}
        onRetry={failure.retryable ? onRetry : undefined}
      />
      <div className="w-full max-w-[320px]">
        <ActionLink href={listHref} replace>
          리스트로 보기
        </ActionLink>
      </div>
    </div>
  );
}
