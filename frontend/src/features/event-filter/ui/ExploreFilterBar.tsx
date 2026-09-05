"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { TimeSlot, TimeSlotFilter } from "@/entities/event";
import {
  ALL_DISTRICTS,
  DISTRICT_LABEL,
  TIME_SLOTS,
  type DistrictCode,
} from "@/shared/config";
import { cn } from "@/shared/lib";
import { Chip } from "@/shared/ui";
import type { ExploreFacets } from "../api/exploreFacets";
import { exploreHref, type ExploreParams } from "../model/exploreParams";
import {
  appliedFilterChips,
  clearAppliedFilters,
  filterButtonLabel,
} from "../model/filterChips";
import { AppliedFilterChips } from "./AppliedFilterChips";
import { FilterSheet } from "./FilterSheet";
import { RegionSheet } from "./RegionSheet";

/**
 * 탐색 상단 컨트롤 (6.2) — 지역 버튼 · 시간대 칩 · 필터 버튼 · 적용 필터 칩 줄.
 *
 * **URL 을 쓰는 유일한 클라이언트 자리다.** 조건을 걸 때도 풀 때도 `exploreHref` 를
 * 거친다 — 여기서 쿼리스트링을 손으로 이어 붙이는 순간 `eligibleOnly` 를 지워
 * 기본값(ON)으로 되살리는 경로가 열린다 (`decisions.md` 4.25).
 *
 * **전환 표시는 사용자가 보고 있는 자리에 붙인다.** `/explore` 는 동적 라우트인데
 * `loading.tsx` 가 아직 없어서(P1-9) 조건을 바꾼 뒤 응답까지 화면이 그대로 서 있는다.
 * 조작하는 자리가 셋이라 표시도 셋이다 — 시간대 칩은 **누른 칩**이, 적용 필터 칩 줄은
 * 자기 링크의 `useLinkStatus` 가, 시트는 `N개 결과 보기` 가 흐려진다(시트가 열려 있는
 * 동안 바는 가려 보이지 않는다).
 */
interface ExploreFilterBarProps {
  params: ExploreParams;
  /** 현재 조건의 결과 수. 시트의 `N개 결과 보기` 가 이 값을 쓴다 */
  resultCount: number;
  /** 시간대 칩·지역 시트가 0건 항목을 감추는 데 쓴다 (6.2 / 6.3) */
  facets: ExploreFacets;
}

export function ExploreFilterBar({
  params,
  resultCount,
  facets,
}: ExploreFilterBarProps) {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [regionOpen, setRegionOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [lastSlot, setLastSlot] = useState<TimeSlotFilter | null>(null);

  function go(next: ExploreParams) {
    startTransition(() => router.replace(exploreHref(next), { scroll: false }));
  }

  /**
   * 어느 칩을 눌렀는지 기억한다. 전환이 끝나면 `pending` 이 내려가면서 표시도 함께
   * 사라지므로 되돌리는 코드가 따로 필요 없다.
   */
  function goSlot(slot: TimeSlotFilter) {
    setLastSlot(slot);
    go({ ...params, query: { ...params.query, slot } });
  }

  const chips = appliedFilterChips(params);

  return (
    <div className="flex flex-col gap-2.5">
      <RegionButton
        district={params.query.district ?? ALL_DISTRICTS}
        expanded={regionOpen}
        onClick={() => setRegionOpen(true)}
      />

      {/* 칩과 필터 버튼이 한 줄에서 `flex-wrap` 된다 — 가로 스크롤을 만들지 않는다 (6.2) */}
      <div className="flex flex-wrap items-center gap-2">
        <TimeSlotChips
          value={params.query.slot ?? "ALL"}
          counts={facets.slot}
          pendingSlot={pending ? lastSlot : null}
          onChange={goSlot}
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

      <RegionSheet
        open={regionOpen}
        onClose={() => setRegionOpen(false)}
        params={params}
        districtCounts={facets.district}
        onChange={go}
      />

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
  pendingSlot,
  onChange,
}: {
  value: TimeSlotFilter;
  /** `null` 이면 세지 못한 것이라 전부 노출한다 (`exploreFacets`) */
  counts: ExploreFacets["slot"];
  /** 눌렀지만 아직 결과가 안 온 칩. 없으면 `null` */
  pendingSlot: TimeSlotFilter | null;
  onChange: (slot: TimeSlotFilter) => void;
}) {
  const visible = TIME_SLOTS.filter(
    (slot) =>
      counts === null ||
      slot.code === "ALL" ||
      slot.code === value ||
      counts[slot.code as TimeSlot] > 0,
  );

  return (
    <div role="group" aria-label="시간대" className="flex flex-wrap gap-2">
      {visible.map((slot) => {
        const busy = slot.code === pendingSlot;
        return (
          <Chip
            key={slot.code}
            selected={slot.code === value}
            aria-busy={busy}
            // 적용 필터 칩과 같은 표시다 — 누른 것만 흐려진다
            className={cn("transition-opacity", busy && "opacity-40")}
            onClick={() => onChange(slot.code)}
          >
            {slot.label}
          </Chip>
        );
      })}
    </div>
  );
}

/**
 * 지역 선택 버튼 (6.2) — `📍 서울 전지역 ▾` 또는 `서울 {구}`.
 *
 * 지역이 적용 필터 칩 줄에서 빠지는 근거가 이 버튼이다. 라벨이 곧 현재 조건이므로
 * 칩으로 한 번 더 보여주면 같은 정보가 두 군데 뜬다 (6.2 표시 제외).
 */
function RegionButton({
  district,
  expanded,
  onClick,
}: {
  district: DistrictCode | typeof ALL_DISTRICTS;
  expanded: boolean;
  onClick: () => void;
}) {
  const label =
    district === ALL_DISTRICTS ? "서울 전지역" : `서울 ${DISTRICT_LABEL[district]}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      className="inline-flex min-h-[40px] w-fit items-center gap-1 rounded-chip px-1 text-[15px] font-bold text-text"
    >
      <PinIcon />
      {label}
      <svg viewBox="0 0 24 24" className="size-4 text-text-sub" aria-hidden>
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px] text-primary" aria-hidden>
      <path
        d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="10" r="2.4" fill="currentColor" />
    </svg>
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
