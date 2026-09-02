import type { Metadata } from "next";
import { eventApi } from "@/entities/event";
import { DesignSystemPreview } from "./_components/DesignSystemPreview";

export const metadata: Metadata = {
  title: "디자인 시스템 · MeetMap",
  robots: { index: false, follow: false },
};

/**
 * Phase 0~1 산출물 확인용 페이지 (`/design-system`).
 *
 * P0-1(토큰) / P0-3(shared/ui) / P0-4(피드백 패턴) / P1-1(카드 variant 5종)의
 * 완료 조건을 눈으로 확인한다. 제품 화면이 아니므로 내비게이션에 노출하지 않고
 * 색인도 막는다. shared/ui 또는 entity 카드에 컴포넌트를 추가하면 여기에도 추가한다.
 *
 * 카드 데이터는 **포트를 통해** 가져온다. `app` 레이어는 `entities/*\/mock/*` 을
 * 직접 import 할 수 없고(ESLint), 그 규칙 덕분에 이 페이지도 실 API 로 전환되면
 * 그대로 실 데이터를 그린다.
 */
export default async function DesignSystemPage() {
  // 목 8건 전부. 경계값 3건(가격 미확인·마감·후기 0)이 여기에 들어 있어야 한다.
  const { items } = await eventApi.getList({ limit: 20 });

  return <DesignSystemPreview events={items} />;
}
