import type { Metadata } from "next";
import { eventApi } from "@/entities/event";
import { DesignSystemPreview } from "./_components/DesignSystemPreview";

export const metadata: Metadata = {
  title: "디자인 시스템 · MeetMap",
  robots: { index: false, follow: false },
};

/**
 * **정적 프리렌더를 끈다.** 이 페이지는 `cookies()`·`searchParams` 를 안 읽어서
 * 기본값이면 빌드 시점에 HTML 로 굳는데, 목 날짜가 이번 주 기준 상대값이라
 * (`decisions.md` 4.31) 굳는 순간 **빌드한 주의 날짜가 영원히 박제된다.**
 * 카드 경계값을 눈으로 확인하는 페이지가 `/explore` 와 다른 날짜를 그리면
 * 기준으로 쓸 수 없다.
 *
 * `/` 와 `/explore` 는 각각 `cookies()`·`searchParams` 를 읽어 이미 동적이다.
 */
export const dynamic = "force-dynamic";

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
