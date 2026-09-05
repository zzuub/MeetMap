"use client";

import type { EventListQuery } from "@/entities/event";
import {
  MOOD_TAGS,
  PRICE_CAPS,
  SCALE_OPTIONS,
  TIME_SLOTS,
  WHEN_OPTIONS,
} from "@/shared/config";
import { cn } from "@/shared/lib";
import { Numeric, PrimaryButton, Sheet } from "@/shared/ui";
import type { ExploreParams } from "../model/exploreParams";
import { hasViewerAxes, resetSheetFilters } from "../model/filterChips";
import {
  FilterLayer,
  FilterToggleRow,
  MultiChipGroup,
  SingleChipGroup,
} from "./FilterGroups";

/**
 * 필터 시트 (6.4).
 *
 * 성격이 다른 **3층**이다 — 1층 자격(프로필 기반 자동 적용, 칩이 아니다) /
 * 2층 일정·시간대(갈 수 있는가) / 3층 취향(가고 싶은가).
 *
 * **적용 버튼이 없다.** 칩을 누르면 그 자리에서 URL 이 바뀌고 결과 수가 따라 움직인다
 * (6.4 "필터는 실시간 반영"). 그래서 이 컴포넌트는 드래프트 상태를 들지 않는다 —
 * URL 이 원본이고(2.4) 여기는 그것을 그리기만 한다.
 */
interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  params: ExploreParams;
  /** 현재 조건의 실시간 결과 수. `N개 결과 보기` 라벨에 쓴다 */
  resultCount: number;
  /** 조건을 바꾼 뒤 새 결과 수를 기다리는 중인가 */
  pending: boolean;
  onChange: (next: ExploreParams) => void;
}

const PRICE_UNLIMITED = "ALL";

const PRICE_OPTIONS = [
  ...PRICE_CAPS.map((cap) => ({ code: String(cap.value), label: cap.label })),
  { code: PRICE_UNLIMITED, label: "제한 없음" },
];

export function FilterSheet({
  open,
  onClose,
  params,
  resultCount,
  pending,
  onChange,
}: FilterSheetProps) {
  const { query } = params;

  /** 축 하나를 바꾼다. `undefined` 는 그 축을 지운다는 뜻이다 */
  function patch(next: Partial<EventListQuery>) {
    const merged = { ...query, ...next };
    for (const key of Object.keys(next) as (keyof EventListQuery)[]) {
      if (next[key] === undefined) delete merged[key];
    }
    onChange({ ...params, query: merged });
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="필터"
      footer={
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(resetSheetFilters(params))}
            className="min-h-[44px] shrink-0 px-1 text-[14px] font-semibold text-text-sub"
          >
            초기화
          </button>
          {/*
            한 자식으로 묶는다 — 버튼의 `gap` 이 숫자와 단위 사이를 벌린다.
            전환 중 흐려지는 것이 시트에서 **유일한 반응**이다. 칩을 눌러도 결과 수가
            그대로면 눌리지 않은 것처럼 보인다 (6.4 "필터는 실시간 반영").
          */}
          <PrimaryButton onClick={onClose}>
            <span
              aria-busy={pending}
              className={cn("transition-opacity", pending && "opacity-50")}
            >
              <Numeric>{resultCount}</Numeric>개 결과 보기
            </span>
          </PrimaryButton>
        </div>
      }
    >
      {/* 게스트에게는 1층과 가격 그룹이 없다 — 판정 근거가 없어 축 자체가 안 실린다 (6.1) */}
      {hasViewerAxes(params) ? (
        <FilterLayer title="1층 · 자격" question="내가 신청이라도 할 수 있는가">
          <FilterToggleRow
            label="내가 신청 가능한 것만"
            description="끄면 자격 밖 회차가 섞이고, 그 카드에 ‘내 나이대 아님’ 이 붙어요"
            checked={query.eligibleOnly === true}
            // 끄기는 파라미터 삭제가 아니라 `false` 다 (`decisions.md` 4.25)
            onChange={(eligibleOnly) => patch({ eligibleOnly })}
          />
        </FilterLayer>
      ) : null}

      <FilterLayer title="2층 · 일정·시간대" question="갈 수 있는가">
        <SingleChipGroup
          label="일정"
          options={WHEN_OPTIONS}
          value={query.when ?? "ALL"}
          onChange={(when) => patch({ when })}
        />
        {/* 상단 시간대 칩과 같은 상태를 공유한다 — 둘 다 URL 의 `slot` 을 본다 (6.2) */}
        <SingleChipGroup
          label="시간대"
          options={TIME_SLOTS}
          value={query.slot ?? "ALL"}
          onChange={(slot) => patch({ slot })}
        />
      </FilterLayer>

      <FilterLayer title="3층 · 취향" question="가고 싶은가">
        <SingleChipGroup
          label="규모"
          options={SCALE_OPTIONS}
          value={query.scale ?? "ALL"}
          onChange={(scale) => patch({ scale })}
        />

        <MultiChipGroup
          label="분위기"
          options={MOOD_TAGS}
          values={query.mood ?? []}
          // 마지막 태그를 빼면 축을 없앤다 — 빈 배열은 "선택 없음"과 같은 뜻이다
          onChange={(mood) => patch({ mood: mood.length > 0 ? mood : undefined })}
        />

        {hasViewerAxes(params) ? (
          <SingleChipGroup
            label="가격"
            options={PRICE_OPTIONS}
            value={query.maxPrice === undefined ? PRICE_UNLIMITED : String(query.maxPrice)}
            onChange={(code) =>
              patch({ maxPrice: code === PRICE_UNLIMITED ? undefined : Number(code) })
            }
          />
        ) : null}

        <FilterToggleRow
          label="신청 가능만 보기"
          checked={query.status === "OPEN"}
          onChange={(on) => patch({ status: on ? "OPEN" : "ALL" })}
        />
      </FilterLayer>
    </Sheet>
  );
}
