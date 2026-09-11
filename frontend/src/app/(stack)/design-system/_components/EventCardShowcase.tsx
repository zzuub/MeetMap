"use client";

import { useState } from "react";
import {
  EventCard,
  EventCardSkeleton,
  type EventCardVariant,
  type EventSummary,
} from "@/entities/event";
import { LikeButton, LikeProvider } from "@/features/event-like";
import { PrimaryButton, SegmentedControl, useToast } from "@/shared/ui";
import { BoundarySection } from "./BoundarySection";
import { PieceSection } from "./PieceSection";
import { VariantSection } from "./VariantSection";
import {
  ALL_VARIANTS,
  SHOWCASE_KEYWORD,
  VIEWERS,
  type CardShowcaseContext,
} from "./cardShowcase";
import { Section } from "./layout";

/**
 * P1-1·P1-2 산출물 — 카드 변형 / 조각 6종 / 경계값. 변형 수는 `ALL_VARIANTS` 가 센다.
 *
 * 세 섹션이 같은 `viewer` 기준을 봐야 해서(가격·자격 배지가 함께 바뀐다) 상태를
 * 여기 한 곳에 두고 렌더 함수만 내려보낸다.
 */
export function EventCardShowcase({ events }: { events: EventSummary[] }) {
  const { showToast } = useToast();
  const [viewerCode, setViewerCode] = useState("F");
  const [liked, setLiked] = useState<string[]>([]);

  /** 서버 액션 자리에 들어가는 로컬 토글. 화면을 벗어나면 사라진다 */
  const toggleShowcaseLike = async (eventId: string, next: boolean) => {
    setLiked((prev) =>
      next ? [...prev, eventId] : prev.filter((id) => id !== eventId),
    );
    return { ok: true } as const;
  };

  const viewer = VIEWERS.find((v) => v.code === viewerCode)?.viewer ?? null;

  /**
   * **실물 찜 버튼이다** (P2-7). 대역을 두지 않는 이유는 이 화면의 목적이
   * "공통 컴포넌트가 실제로 어떻게 보이는가" 라서다 — 대역은 그 답을 못 준다.
   * 토글은 아래 `LikeProvider` 안에서만 살고 서버에 남지 않는다.
   */
  const likeSlot = (event: EventSummary) => <LikeButton eventId={event.id} />;

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
    card: (event, variant: EventCardVariant) =>
      // `search` 만 검색어를 받는다 — 타입이 나머지 변형에는 못 넘기게 막는다 (4.67)
      variant === "search" ? (
        <EventCard
          key={`${variant}-${event.id}`}
          event={event}
          variant="search"
          keyword={SHOWCASE_KEYWORD}
          viewer={viewer}
          action={likeSlot(event)}
        />
      ) : (
        <EventCard
          key={`${variant}-${event.id}`}
          event={event}
          variant={variant}
          viewer={viewer}
          action={variant === "sheet" ? applySlot : likeSlot(event)}
        />
      ),
    pick: (id) => events.find((event) => event.id === id),
    sample: (index) => events[index % Math.max(events.length, 1)],
  };

  return (
    /*
      서버에 남기지 않는다 — 이 화면은 컴포넌트를 보는 자리다.
      ⚠️ **찜 버튼을 그리는 섹션이 둘이다**(변형 · 경계값). 둘 다 `card()` 를 쓰므로
      공급자는 그 둘을 함께 덮어야 한다 — 변형 섹션만 두르면 페이지가 500 이다 (4.51 표)
    */
    <LikeProvider liked={liked} toggleLike={toggleShowcaseLike}>
      <Section
        title={`소개팅 카드 — variant ${ALL_VARIANTS.length}종`}
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
        title={`카드 스켈레톤 — variant ${ALL_VARIANTS.length}종`}
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
        note="P1-0 목 데이터에 심어 둔 경계가 변형마다 어떻게 떨어지는지"
      >
        <BoundarySection {...context} />
      </Section>
    </LikeProvider>
  );
}
