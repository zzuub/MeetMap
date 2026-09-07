import { venueDisplay, type EventDetail } from "@/entities/event";
import { DetailSection } from "./DetailSection";

/**
 * 장소 (7.1 · 6.6).
 *
 * 정밀도가 셋이라 **정확한 주소가 있는 건이 오히려 소수**다. 근사 표기를 주소처럼
 * 보이게 하면 헛걸음하므로 `EXACT` 만 장소명·주소를 쓰고 나머지는 카드·마커 시트와
 * 같은 문자열(`강남역 인근` · `마포구`)로 떨어진다 — 분기는 `venueDisplay` 한 곳이다.
 */
export function VenueBlock({ event }: { event: EventDetail }) {
  const venue = venueDisplay(event);

  return (
    <DetailSection title="장소">
      <div className="rounded-card border border-border bg-surface px-4 py-3.5">
        {venue.kind === "exact" ? (
          <>
            <p className="text-[14px] font-bold text-text">{venue.venueName}</p>
            {venue.address ? (
              <p className="mt-1 text-[13px] leading-5 text-text-sub">{venue.address}</p>
            ) : null}
          </>
        ) : (
          <p className="text-[14px] font-bold text-text">{venue.label}</p>
        )}
      </div>
    </DetailSection>
  );
}
