import type { EventDetail } from "@/entities/event";
import { AttendeeListBlock } from "./AttendeeListBlock";
import { LikeButton } from "@/features/event-like";
import { DetailCtaBar } from "./DetailCtaBar";
import { DetailHero } from "./DetailHero";
import { DetailSection } from "./DetailSection";
import { InfoCard } from "./InfoCard";
import { ProviderBlock } from "./ProviderBlock";
import { VenueBlock } from "./VenueBlock";

/**
 * 소개팅 상세 (7.1).
 *
 * 하단 고정 CTA 는 P1-8 이 모달과 함께 세웠다 (4.32). **찜·비교 담기 자리는
 * 슬롯으로 비어 있고**(4.36) P2-7·P3-4 가 채운다. 본문 하단 여백이 바 높이를
 * 비워 두는데, 이 값이 조건부가 되는 것은 P3-4 의 몫이다 (4.32 ⚠️).
 */
export function EventDetailView({ event }: { event: EventDetail }) {
  return (
    <article className="pb-[calc(var(--height-fixed-cta)+16px)]">
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

      {/* 7.2 의 48px 원형. 비교 담기는 P3-4 가 채운다 (4.36) */}
      <DetailCtaBar event={event} like={<LikeButton eventId={event.id} size="cta" />} />
    </article>
  );
}
