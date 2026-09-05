"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TimeSlot, TimeSlotFilter } from "@/entities/event";
import { TIME_SLOTS } from "@/shared/config";
import { Chip } from "@/shared/ui";
import type { SlotCounts } from "../api/slotCounts";
import { exploreHref, type ExploreParams } from "../model/exploreParams";
import {
  appliedFilterChips,
  clearAppliedFilters,
  filterButtonLabel,
} from "../model/filterChips";
import { AppliedFilterChips } from "./AppliedFilterChips";
import { FilterSheet } from "./FilterSheet";

/**
 * 탐색 상단 컨트롤 (6.2) — 시간대 칩 · 필터 버튼 · 적용 필터 칩 줄.
 *
 * **URL 을 쓰는 유일한 클라이언트 자리다.** 조건을 걸 때도 풀 때도 `exploreHref` 를
 * 거친다 — 여기서 쿼리스트링을 손으로 이어 붙이는 순간 `eligibleOnly` 를 지워
 * 기본값(ON)으로 되살리는 경로가 열린다 (`decisions.md` 4.25).
 *
 * **전환 표시는 사용자가 보고 있는 자리에 붙인다.** `/explore` 는 동적 라우트인데
 * `loading.tsx` 가 아직 없어서(P1-9) 조건을 바꾼 뒤 응답까지 화면이 그대로 서 있는다.
 * 시트가 열려 있는 동안 바는 시트에 가려 보이지 않으므로, 이 컴포넌트의 전환 상태는
 * 시트의 `N개 결과 보기` 로 넘긴다. 칩 줄은 자기 링크의 `useLinkStatus` 를 쓴다.
 */
interface ExploreFilterBarProps {
  params: ExploreParams;
  /** 현재 조건의 결과 수. 시트의 `N개 결과 보기` 가 이 값을 쓴다 */
  resultCount: number;
  slotCounts: SlotCounts;
}

export function ExploreFilterBar({
  params,
  resultCount,
  slotCounts,
}: ExploreFilterBarProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function go(next: ExploreParams) {
    startTransition(() => router.replace(exploreHref(next), { scroll: false }));
  }

  const chips = appliedFilterChips(params);

  return (
    <div className="flex flex-col gap-2.5">
      {/* 칩과 필터 버튼이 한 줄에서 `flex-wrap` 된다 — 가로 스크롤을 만들지 않는다 (6.2) */}
      <div className="flex flex-wrap items-center gap-2">
        <TimeSlotChips
          value={params.query.slot ?? "ALL"}
          counts={slotCounts}
          onChange={(slot) => go({ ...params, query: { ...params.query, slot } })}
        />

        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={sheetOpen}
          className="ml-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-chip border border-border bg-surface px-3.5 text-[13px] font-semibold text-text-sub"
        >
          <FilterIcon />
          {filterButtonLabel(params)}
        </button>
      </div>

      <AppliedFilterChips chips={chips} clearHref={exploreHref(clearAppliedFilters(params))} />

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        params={params}
        resultCount={resultCount}
        pending={pending}
        onChange={go}
      />
    </div>
  );
}

/**
 * 시간대 칩 — 단일 선택 (6.2).
 *
 * **건수 0인 슬롯은 그리지 않는다.** 단 지금 선택된 슬롯은 0건이어도 남긴다 — 다른
 * 조건을 좁혀 0건이 됐을 때 칩이 사라지면 걸려 있는 필터를 풀 수 없다.
 */
function TimeSlotChips({
  value,
  counts,
  onChange,
}: {
  value: TimeSlotFilter;
  counts: SlotCounts;
  onChange: (slot: TimeSlotFilter) => void;
}) {
  const visible = TIME_SLOTS.filter(
    (slot) =>
      slot.code === "ALL" || slot.code === value || counts[slot.code as TimeSlot] > 0,
  );

  return (
    <div role="group" aria-label="시간대" className="flex flex-wrap gap-2">
      {visible.map((slot) => (
        <Chip key={slot.code} selected={slot.code === value} onClick={() => onChange(slot.code)}>
          {slot.label}
        </Chip>
      ))}
    </div>
  );
}

function FilterIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
