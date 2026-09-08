import type { EventDetail } from "@/entities/event";
import { AttendeeListBlock } from "./AttendeeListBlock";
import { DetailHero } from "./DetailHero";
import { DetailSection } from "./DetailSection";
import { InfoCard } from "./InfoCard";
import { ProviderBlock } from "./ProviderBlock";
import { VenueBlock } from "./VenueBlock";

/**
 * 소개팅 상세 (7.1).
 *
 * ⚠️ **하단 고정 CTA(찜 / 비교 담기 / 신청하기)가 아직 없다.** 세 버튼의 동작이
 * 각각 P2-7 · P3-4 · P1-8 이라 지금 붙이면 셋 다 눌러도 아무 일이 없다. 4.29 가
 * 뷰 토글에 쓴 기준이고, 특히 `신청하기` 를 `externalApplyUrl` 로 직결하면 결제
 * 비대행 고지(7.3)를 우회하는 경로가 생긴다 — **P1-8 이 모달과 함께 바를 세운다**
 * (`decisions.md` 4.32). 그래서 본문 하단 여백도 CTA 높이를 비워두지 않는다.
 */
export function EventDetailView({ event }: { event: EventDetail }) {
  return (
    <article className="pb-10">
      <DetailHero event={event} />

      <div className="mt-6 flex flex-col gap-6 px-5">
        <ProviderBlock provider={event.provider} />
        <InfoCard event={event} />
        <VenueBlock event={event} />
        <AttendeeListBlock event={event} />

        <DetailSection title="소개">
          <p className="text-[14px] leading-6 whitespace-pre-line text-text-sub">
            {event.description}
          </p>
        </DetailSection>
      </div>
    </article>
  );
}
