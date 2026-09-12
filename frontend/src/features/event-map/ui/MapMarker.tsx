import Link from "next/link";
import type { LocationPrecision } from "@/entities/event";
import { cn } from "@/shared/lib";
import type { MapMarkerModel } from "../model/markers";

/**
 * 핀 모양 — 위치 정밀도를 **모양으로** 가른다 (6.6). 범례(`MapLegend`)도 이 표를 쓴다 —
 * 두 벌이면 범례와 핀이 어긋난다.
 */
export const PIN_SHAPE: Record<LocationPrecision, string> = {
  // 채운 핀
  EXACT: "border-2 border-surface bg-secondary",
  // 테두리 핀
  STATION: "border-[2.5px] border-secondary bg-surface",
  // 반투명 핀
  DISTRICT: "border-2 border-surface bg-secondary opacity-45",
};

/**
 * 지도 마커 (6.6) — 시각 라벨 + 정밀도별 핀.
 *
 * **상세로 가는 링크다** — 마커 시트는 P3-2 다. 누르면 아무 일도 없는 마커를 그리지 않는다
 * (`decisions.md` 4.29 · 4.71). `prefetch` 를 끈 것은 지도에 뜬 마커마다 상세를 미리 받게
 * 되기 때문이다.
 *
 * 훅이 없다 — SDK 오버레이 안으로 포털되지만 그리는 것은 이 컴포넌트라 `react-dom/server`
 * 로 잠근다 (4.10). 히트 영역은 44×44 를 채우고 핀 끝이 아래 가운데에 온다 (15장).
 */
export function MapMarker({ marker }: { marker: MapMarkerModel }) {
  return (
    <Link
      href={marker.href}
      prefetch={false}
      aria-label={marker.accessibleName}
      data-precision={marker.precision}
      className="flex min-h-11 min-w-11 flex-col items-center justify-end"
    >
      <span
        aria-hidden
        className="mb-1 whitespace-nowrap rounded-chip border border-border bg-surface px-2 py-0.5 text-[11px] font-bold text-text shadow-md"
      >
        {marker.label}
      </span>
      <span
        aria-hidden
        className={cn(
          "block size-4 -rotate-45 rounded-[50%_50%_50%_0] shadow-md",
          PIN_SHAPE[marker.precision],
        )}
      />
    </Link>
  );
}
