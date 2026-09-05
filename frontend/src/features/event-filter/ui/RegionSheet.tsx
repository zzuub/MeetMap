"use client";

import {
  ALL_DISTRICTS,
  PROVINCES,
  SEOUL_DISTRICTS,
  type DistrictCode,
  type ProvinceCode,
} from "@/shared/config";
import { cn } from "@/shared/lib";
import { Numeric, Sheet } from "@/shared/ui";
import type { ExploreParams } from "../model/exploreParams";

/**
 * 지역 선택 시트 (6.3).
 *
 * **시/도 → 시/군/구 2단**이다. MVP1 은 서울 전용이지만 경기·인천 확장 계획이 있어
 * 처음부터 계층으로 짓는다 — 평평한 칩으로 만들면 확장할 때 화면을 다시 짜야 한다.
 * 서울 외 시/도는 `오픈 예정` 라벨과 함께 비활성이고, 자리만 미리 잡아 둔다.
 *
 * **필터 시트(6.4)와 별개 진입점이다.** 지역은 "어디서" 축, 필터는 "어떤 조건" 축으로
 * UX 상 분리한다 — 그래서 지역은 적용 필터 칩 줄에도 나오지 않는다(상단 버튼이 그
 * 역할을 한다, 6.2).
 *
 * **고르면 닫는다.** 필터 시트와 달리 `N개 결과 보기` 같은 확정 버튼이 사양에 없고
 * (6.3 기능 표), 단일 선택이라 고른 뒤 시트에 남아 할 일이 없다.
 */
interface RegionSheetProps {
  open: boolean;
  onClose: () => void;
  params: ExploreParams;
  /**
   * 구별 건수. **현재 걸린 다른 필터가 반영된 값**이다 — 시간대 칩(6.2)과 같은 규칙으로,
   * `3곳` 이라 해놓고 눌렀더니 0건인 상황을 만들지 않는다.
   * `null` 이면 세지 못한 것이라 전 구를 노출하고 건수를 감춘다.
   */
  districtCounts: Partial<Record<DistrictCode, number>> | null;
  onChange: (next: ExploreParams) => void;
}

export function RegionSheet({
  open,
  onClose,
  params,
  districtCounts,
  onChange,
}: RegionSheetProps) {
  const selected = params.query.district ?? ALL_DISTRICTS;

  function select(district: DistrictCode | typeof ALL_DISTRICTS) {
    onChange({ ...params, query: { ...params.query, district } });
    onClose();
  }

  return (
    <Sheet open={open} onClose={onClose} title="지역 선택" maxHeight="70vh">
      <div className="flex min-h-0 gap-3">
        <ProvinceRail selected={params.query.province ?? "SEOUL"} />
        <DistrictList
          selected={selected}
          counts={districtCounts}
          onSelect={select}
        />
      </div>
    </Sheet>
  );
}

/**
 * 1단 · 시/도. **서울만 선택 가능**하고 나머지는 눌러도 무반응이다.
 * `disabled` 로 두어 스크린리더·키보드에서도 순회 대상에서 빠진다.
 */
function ProvinceRail({ selected }: { selected: ProvinceCode }) {
  return (
    <ul aria-label="시/도" className="w-[92px] shrink-0 border-r border-border pr-2">
      {PROVINCES.map((province) => (
        <li key={province.code}>
          <button
            type="button"
            disabled={!province.enabled}
            aria-current={province.code === selected}
            className={cn(
              "flex min-h-[44px] w-full flex-col justify-center rounded-[10px] px-2.5 text-left",
              "text-[14px] transition-colors",
              province.code === selected
                ? "bg-active font-bold text-text"
                : "font-medium text-text-sub",
              province.enabled ? "hover:bg-accent-soft" : "cursor-not-allowed opacity-45",
            )}
          >
            {province.label}
            {province.enabled ? null : (
              <span className="text-[10px] font-medium">오픈 예정</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

interface DistrictListProps {
  selected: DistrictCode | typeof ALL_DISTRICTS;
  counts: Partial<Record<DistrictCode, number>> | null;
  onSelect: (district: DistrictCode | typeof ALL_DISTRICTS) => void;
}

/**
 * 2단 · 시/군/구. `서울 전지역` + **소개팅이 있는 구만** 나열한다 (6.3).
 *
 * 지금 선택된 구는 건수가 0이어도 남긴다 — 다른 조건을 좁혀 0건이 됐을 때 항목이
 * 사라지면 걸려 있는 지역을 풀 수 없다(시간대 칩과 같은 이유).
 */
function DistrictList({ selected, counts, onSelect }: DistrictListProps) {
  const districts = SEOUL_DISTRICTS.filter(
    (district) =>
      counts === null || district.code === selected || (counts[district.code] ?? 0) > 0,
  );

  return (
    <ul aria-label="시/군/구" className="min-w-0 flex-1">
      <li>
        <DistrictRow
          label="서울 전지역"
          selected={selected === ALL_DISTRICTS}
          onSelect={() => onSelect(ALL_DISTRICTS)}
        />
      </li>

      {districts.map((district) => (
        <li key={district.code}>
          <DistrictRow
            label={district.label}
            // 셌으면 0 도 그린다 — 선택된 구가 0건일 때 `0곳` 이 빈 결과의 이유를 말한다
            count={counts === null ? undefined : (counts[district.code] ?? 0)}
            selected={selected === district.code}
            onSelect={() => onSelect(district.code)}
          />
        </li>
      ))}
    </ul>
  );
}

function DistrictRow({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-[46px] w-full items-center justify-between gap-2 rounded-[10px] px-3",
        "text-[14px] transition-colors hover:bg-accent-soft",
        selected ? "bg-active font-bold text-text" : "font-medium text-text",
      )}
    >
      {label}
      {count === undefined ? null : (
        <span className="text-[12px] text-text-sub">
          <Numeric>{count}</Numeric>곳
        </span>
      )}
    </button>
  );
}
