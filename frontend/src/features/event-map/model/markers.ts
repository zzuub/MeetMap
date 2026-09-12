import {
  locationLabel,
  type EventSummary,
  type LocationPrecision,
} from "@/entities/event";

/**
 * 마커 하나가 보여 주는 것 (6.6).
 *
 * **라벨은 시각뿐이다** — 소개팅명은 2026-08-31 에 뺐다. 그래서 무엇인지는 스크린리더 이름이
 * 말한다(날짜·시각·제목·위치). 위치는 카드·상세와 같은 `locationLabel` 이다 — 정밀도 3분기가
 * 두 벌이 되면 화면마다 다른 답을 낸다.
 */
export interface MapMarkerModel {
  id: string;
  lat: number;
  lng: number;
  label: string;
  precision: LocationPrecision;
  /** P3-2 의 마커 시트 전까지는 상세로 간다 (`decisions.md` 4.71) */
  href: string;
  accessibleName: string;
}

export function toMapMarker(event: EventSummary): MapMarkerModel {
  return {
    id: event.id,
    lat: event.lat,
    lng: event.lng,
    label: event.timeLabel,
    precision: event.locationPrecision,
    href: `/events/${event.id}`,
    accessibleName: `${event.dateLabel} ${event.timeLabel} ${event.title} · ${locationLabel(event)}`,
  };
}
