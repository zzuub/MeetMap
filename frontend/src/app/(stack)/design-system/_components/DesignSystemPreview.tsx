"use client";

import type { EventSummary } from "@/entities/event";
import { AppHeader } from "@/widgets/app-header";
import { EventCardShowcase } from "./EventCardShowcase";
import { SharedUiShowcase } from "./SharedUiShowcase";

interface DesignSystemPreviewProps {
  /**
   * `eventApi.getList` 결과. `app` 레이어는 목 모듈을 직접 import 할 수 없으므로
   * (ESLint 슬라이스 경계 규칙) 서버 컴포넌트가 포트를 통해 받아 넘긴다.
   */
  events: EventSummary[];
}

/**
 * `/design-system` 조립부.
 *
 * 쇼케이스는 산출물 단위로 나눈다 — 상태가 그 안에서만 쓰이므로 여기로 끌어올릴
 * 이유가 없고, 섹션이 늘어도 이 파일은 그대로다.
 */
export function DesignSystemPreview({ events }: DesignSystemPreviewProps) {
  return (
    <>
      <AppHeader title="디자인 시스템" backHref="/" />

      <div className="flex flex-col gap-8 px-5 py-6">
        <EventCardShowcase events={events} />
        <SharedUiShowcase />
      </div>
    </>
  );
}
