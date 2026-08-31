import type { Metadata } from "next";
import { DesignSystemPreview } from "./_components/DesignSystemPreview";

export const metadata: Metadata = {
  title: "디자인 시스템 · MeetMap",
  robots: { index: false, follow: false },
};

/**
 * Phase 0 산출물 확인용 페이지 (`/design-system`).
 *
 * P0-1(토큰) / P0-3(shared/ui) / P0-4(피드백 패턴)의 완료 조건을 눈으로 확인한다.
 * 제품 화면이 아니므로 내비게이션에 노출하지 않고 색인도 막는다.
 * shared/ui 에 컴포넌트를 추가하면 여기에도 추가한다.
 */
export default function DesignSystemPage() {
  return <DesignSystemPreview />;
}
