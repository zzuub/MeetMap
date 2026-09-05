"use client";

import type { ReactNode } from "react";
import { Chip, Toggle } from "@/shared/ui";

/**
 * 필터 시트의 조립 부품 (6.4).
 *
 * 시트가 3층 × 그룹 7개라 본문을 한 함수에 담으면 읽을 수 없다. 그룹의 **모양**은
 * 여기, 어떤 그룹이 어느 층에 놓이는지는 `FilterSheet` 가 갖는다.
 */

interface LayerProps {
  /** `1층 · 자격` — 시트가 3층 구조라는 것이 눈에 보여야 한다 */
  title: string;
  /** 그 층이 답하는 질문. 예: "내가 신청이라도 할 수 있는가" */
  question: string;
  children: ReactNode;
}

export function FilterLayer({ title, question, children }: LayerProps) {
  return (
    <section className="border-t border-border py-4 first:border-t-0 first:pt-1">
      <h3 className="text-[13px] font-bold text-text-sub">
        {title}
        <span className="ml-1.5 font-medium opacity-70">{question}</span>
      </h3>
      <div className="mt-3 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[14px] font-semibold text-text">{label}</p>
      {/* 칩 줄은 `flex-wrap`. 가로 스크롤로 만들지 않는다 (6.2 원칙) */}
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

interface Option<T extends string> {
  code: T;
  label: string;
}

/** 단일 선택 그룹 — 일정·시간대·규모·가격 (6.4) */
export function SingleChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Group label={label}>
      {options.map((option) => (
        <Chip
          key={option.code}
          selected={option.code === value}
          onClick={() => onChange(option.code)}
        >
          {option.label}
        </Chip>
      ))}
    </Group>
  );
}

/**
 * 다중 선택 그룹 — 분위기 (6.4, OR 조건).
 *
 * 다음 값을 `options` 순회로 만든다. 탭한 순서로 담으면 같은 조건이 URL 마다 달라져
 * 공유 링크가 서로 달라 보인다.
 */
export function MultiChipGroup({
  label,
  options,
  values,
  onChange,
}: {
  label: string;
  options: readonly string[];
  values: readonly string[];
  onChange: (values: string[]) => void;
}) {
  return (
    <Group label={label}>
      {options.map((option) => {
        const selected = values.includes(option);
        return (
          <Chip
            key={option}
            multiple
            selected={selected}
            onClick={() =>
              onChange(
                options.filter((o) => (o === option ? !selected : values.includes(o))),
              )
            }
          >
            {option}
          </Chip>
        );
      })}
    </Group>
  );
}

/** 토글 한 줄 — 자격(1층)·모집 상태(3층). 칩 그룹이 아니다 (6.4) */
export function FilterToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-text">{label}</p>
        {description ? (
          <p className="mt-0.5 text-[12px] leading-4 text-text-sub">{description}</p>
        ) : null}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
