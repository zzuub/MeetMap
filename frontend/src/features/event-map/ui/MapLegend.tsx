import type { LocationPrecision } from "@/entities/event";
import { cn } from "@/shared/lib";
import { PRECISION_LEGEND } from "../model/copy";
import { PIN_SHAPE } from "./MapMarker";

/** 범례 (6.6) — 핀 모양 셋이 무엇을 뜻하나. 지도 왼쪽 아래 */
export function MapLegend() {
  const precisions = Object.keys(PRECISION_LEGEND) as LocationPrecision[];

  return (
    <ul
      aria-label="마커 모양"
      className="absolute bottom-3.5 left-3 flex flex-col gap-1.5 rounded-button border border-border bg-surface/95 px-3 py-2.5"
    >
      {precisions.map((precision) => (
        <li
          key={precision}
          className="flex items-center gap-2 text-[11px] font-semibold text-text-sub"
        >
          <span aria-hidden className={cn("size-3 shrink-0 rounded-chip", PIN_SHAPE[precision])} />
          {PRECISION_LEGEND[precision]}
        </li>
      ))}
    </ul>
  );
}
