import { IconButton } from "@/shared/ui";
import { ZOOM_LABEL } from "../model/copy";
import { zoomAvailability, type ZoomDirection } from "../model/viewport";

interface ZoomControlProps {
  /** 지금 레벨. 지도가 뜨기 전이면 `null` 이고 둘 다 막는다 */
  level: number | null;
  onZoom(direction: ZoomDirection): void;
}

/**
 * 커스텀 줌 `+ / −` (6.6 · 6.7 — SDK 기본 줌 UI 를 쓰지 않는다). 지도 우측 하단, 44×44 (15장).
 *
 * **한계에서는 `disabled` 가 아니라 `aria-disabled` 다.** `disabled` 버튼은 포커스를 잃어
 * 스크린리더가 사유(`더 확대할 수 없어요`)를 읽을 기회가 없다. 아이콘 버튼에서 2.5 의
 * "라벨이 사유를 말한다"를 지키는 방법이 **이름을 사유로 바꾸는 것**이다. 누르면 아무 일도
 * 하지 않고 토스트도 없다.
 *
 * 훅이 없다 — 테스트가 함수로 불러 돌려받은 버튼의 `onClick` 을 직접 누른다 (4.39 · 4.61).
 */
export function ZoomControl({ level, onZoom }: ZoomControlProps) {
  const { canZoomIn, canZoomOut } =
    level === null ? { canZoomIn: false, canZoomOut: false } : zoomAvailability(level);

  return (
    <div className="absolute bottom-3.5 right-3.5 flex flex-col overflow-hidden rounded-button border border-border bg-surface shadow-md">
      {zoomButton("in", canZoomIn, onZoom)}
      <span aria-hidden className="h-px bg-border" />
      {zoomButton("out", canZoomOut, onZoom)}
    </div>
  );
}

function zoomButton(
  direction: ZoomDirection,
  enabled: boolean,
  onZoom: (direction: ZoomDirection) => void,
) {
  const label = ZOOM_LABEL[direction];

  return (
    <IconButton
      label={enabled ? label.enabled : label.limit}
      aria-disabled={!enabled}
      onClick={() => {
        if (enabled) onZoom(direction);
      }}
      className="aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent"
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path
          d={direction === "in" ? "M12 5v14M5 12h14" : "M5 12h14"}
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    </IconButton>
  );
}
