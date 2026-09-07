import type { ReactNode } from "react";
import {
  BirthYearRangeText,
  CapacityText,
  PriceText,
  type EventDetail,
} from "@/entities/event";
import { DetailSection } from "./DetailSection";

/**
 * 정보 카드 (7.1) — 참가비 / 참가 연령 / 모집 정원 / 참석자 직업군.
 *
 * **여기 세 행이 7.2 가 말하는 참석자 집계값 그 자체다** — 출생연도 범위·직업군·
 * 남녀 정원. 그래서 참석자 블록이 같은 값을 다시 쓰지 않는다 (`decisions.md` 4.33).
 *
 * ⚠️ **참가비는 남·여를 항상 병기한다** (7.1). 카드는 사용자 성별 기준값 하나만
 * 쓰지만(2.2) 상세는 조건 고지가 목적이라 양쪽이 필요하다 — 외부 이동 모달의
 * 조건 확인 블록(7.3)과 같은 이유다. `gender={null}` 은 "게스트라서"가 아니라
 * **이 자리의 규칙**이라 viewer 가 붙는 P2-4 이후에도 그대로다.
 */
export function InfoCard({ event }: { event: EventDetail }) {
  return (
    <DetailSection title="정보">
      <dl className="flex flex-col gap-2.5 rounded-card border border-border bg-surface px-4 py-3.5">
        <InfoRow label="참가비">
          <PriceText
            malePrice={event.malePrice}
            femalePrice={event.femalePrice}
            gender={null}
            className="font-bold text-text"
          />
        </InfoRow>

        <InfoRow label="참가 연령">
          <BirthYearRangeText
            birthYearFrom={event.birthYearFrom}
            birthYearTo={event.birthYearTo}
            className="font-bold text-text"
          />
        </InfoRow>

        <InfoRow label="모집 정원">
          <CapacityText
            maleCapacity={event.maleCapacity}
            femaleCapacity={event.femaleCapacity}
            className="font-bold text-text"
          />
        </InfoRow>

        {/* 자유 입력 태그라 비어 있을 수 있다 (4.15). 빈 행을 남기지 않는다 */}
        {event.jobGroups.length > 0 ? (
          <InfoRow label="참석자 직업군">
            <span className="font-bold text-text">{event.jobGroups.join(" · ")}</span>
          </InfoRow>
        ) : null}
      </dl>
    </DetailSection>
  );
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <dt className="shrink-0 text-text-sub">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}
