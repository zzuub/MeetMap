"use client";

import { useState } from "react";
import {
  EventCard,
  EventCardSkeleton,
  type EventCardVariant,
  type EventSummary,
} from "@/entities/event";
import { IconButton, PrimaryButton, SegmentedControl, useToast } from "@/shared/ui";
import { BoundarySection } from "./BoundarySection";
import { PieceSection } from "./PieceSection";
import { VariantSection } from "./VariantSection";
import { ALL_VARIANTS, VIEWERS, type CardShowcaseContext } from "./cardShowcase";
import { Section } from "./layout";

/**
 * P1-1·P1-2 산출물 — 카드 5종 / 조각 6종 / 경계값.
 *
 * 세 섹션이 같은 `viewer` 기준을 봐야 해서(가격·자격 배지가 함께 바뀐다) 상태를
 * 여기 한 곳에 두고 렌더 함수만 내려보낸다.
 */
export function EventCardShowcase({ events }: { events: EventSummary[] }) {
  const { showToast } = useToast();
  const [viewerCode, setViewerCode] = useState("F");

  const viewer = VIEWERS.find((v) => v.code === viewerCode)?.viewer ?? null;

  /** 찜 버튼 자리를 채우는 대역. 실제 버튼은 `features/event-like` 가 만든다 (P2) */
  const likeSlot = (
    <IconButton
      label="찜하기"
      // 44×44 히트 영역은 IconButton 기본값이다 (15장). 크기를 덮어쓰면
      // cn() 이 Tailwind 충돌을 해결하지 못해 `size-9` 와 `size-11` 이 싸운다
      className="bg-surface/90 backdrop-blur-[2px]"
      onClick={() => showToast("찜 버튼은 features/event-like 의 몫입니다 (P2)")}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path
          d="M12 20s-7.2-4.6-7.2-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.2 2.4C19.2 15.4 12 20 12 20z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );

  /** 마커 시트 하단의 신청 버튼. 7.3 외부 이동 모달을 경유해야 한다 (P1-8) */
  const applySlot = (
    <PrimaryButton
      fullWidth={false}
      onClick={() => showToast("외부 이동 모달은 P1-8 에서 붙습니다")}
    >
      신청 페이지로 이동
    </PrimaryButton>
  );

  const context: CardShowcaseContext = {
    events,
    card: (event, variant: EventCardVariant) => (
      <EventCard
        key={`${variant}-${event.id}`}
        event={event}
        variant={variant}
        viewer={viewer}
        action={variant === "sheet" ? applySlot : likeSlot}
      />
    ),
    pick: (id) => events.find((event) => event.id === id),
    sample: (index) => events[index % Math.max(events.length, 1)],
  };

  return (
    <>
      <Section
        title="소개팅 카드 — variant 5종"
        note="14.1 / 5.3 / 6.5 / 6.6 — 한 컴포넌트에 variant prop 으로 통합"
      >
        <SegmentedControl
          label="가격·자격 기준"
          value={viewerCode}
          onChange={setViewerCode}
          options={VIEWERS.map((v) => ({ value: v.code, label: v.label }))}
        />
        <p className="text-[12px] leading-5 text-text-sub">
          가격은 <b>사용자 성별 기준값만</b> 노출한다. 게스트는 어느 쪽이 자기 값인지
          알 수 없으므로 남·여를 병기한다. <code>ratio</code> 의 자격 배지도 기준을
          바꾸면 같이 바뀐다.
        </p>

        <VariantSection {...context} />
      </Section>

      <Section
        title="카드 조각"
        note="P1-2 — 배지 · 정원 · 가격. 카드 밖에서도 쓸 수 있게 나눠 둔 단위다"
      >
        <PieceSection />
      </Section>

      <Section
        title="카드 스켈레톤 — variant 5종"
        note="11.3 — 진짜 카드와 같은 높이여야 한다. 낮으면 응답이 온 순간 아래가 밀린다"
      >
        <div className="-mx-5 flex items-start gap-3 overflow-x-auto px-5 pb-1">
          {ALL_VARIANTS.map((variant) => (
            <div key={variant} className="flex w-[280px] shrink-0 flex-col gap-1">
              <span className="text-[11px] text-text-sub">{variant}</span>
              <EventCardSkeleton variant={variant} />
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="카드 경계값"
        note="P1-0 목 데이터에 심어 둔 경계가 5종에서 각각 어떻게 떨어지는지"
      >
        <BoundarySection {...context} />
      </Section>
    </>
  );
}
