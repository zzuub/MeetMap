"use client";

import { useState } from "react";
import type { EventDetail } from "@/entities/event";
import { PrimaryButton } from "@/shared/ui";
import { ApplyOutboundModal } from "./ApplyOutboundModal";

/**
 * 하단 고정 CTA 의 `신청하기` (7.2) — **외부 이동 모달(7.3)의 유일한 입구**.
 *
 * 버튼과 모달을 한 덩어리로 내보내는 것이 요점이다. 화면이 모달을 직접 열게 두면
 * 모달 없이 버튼만 놓는 자리가 생기고, 그게 7.3 을 우회하는 경로다 — P3-2 마커
 * 시트의 신청 버튼도 이 슬라이스를 거친다. 마감 회차에도 비활성이 아니다 (4.37).
 */
export function ApplyButton({ event }: { event: EventDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PrimaryButton onClick={() => setOpen(true)}>신청하기</PrimaryButton>
      <ApplyOutboundModal event={event} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
