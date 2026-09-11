import { EventDetailSkeleton } from "@/widgets/event-detail";

/**
 * 상세 로딩 폴백 (11.3).
 *
 * 카드에서 상세로 들어오는 것이 이 제품의 주 경로라(카드 변형이 전부 여기로 온다)
 * **탭한 뒤 아무 반응 없는 300ms 가 가장 자주 밟히는 빈 구간**이다.
 *
 * `AppHeader` 는 여기서 그리지 않는다 — 페이지가 그리는 것과 겹쳐 두 번 마운트된다.
 * 뒤로가기는 그 사이 브라우저·제스처로 열려 있다.
 */
export default function EventDetailLoading() {
  return <EventDetailSkeleton />;
}
