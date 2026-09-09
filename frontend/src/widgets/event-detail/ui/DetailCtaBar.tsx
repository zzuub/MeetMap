import type { ReactNode } from "react";
import { ApplyButton } from "@/features/event-apply";
import type { EventDetail } from "@/entities/event";

/**
 * 하단 고정 CTA (7.2).
 *
 * **찜·비교 담기 자리는 슬롯이다** — 비면 아무것도 그리지 않으므로 자리표시자
 * 버튼과 다르다 (`decisions.md` 4.36). 4.16 이 카드에 쓴 것과 같은 형태다.
 *
 * 포털하지 않는다 — 4.8 의 함정은 **조상의** `transform`/`backdrop-filter` 인데
 * `(stack)` 셸에는 둘 다 없고, 이 바는 오버레이가 아니라 상시 노출 크롬이다.
 */
export function DetailCtaBar({
  event,
  like,
  compare,
}: {
  event: EventDetail;
  /** P2-7 이 채운다 (48px 원형) */
  like?: ReactNode;
  /** P3-4 가 채운다 (flex 1) */
  compare?: ReactNode;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40">
      <div className="mx-auto flex h-[var(--height-fixed-cta)] w-full max-w-shell items-center gap-2 border-t border-border bg-surface px-5">
        {like}
        {compare}
        {/* 7.2 의 `flex 1.4` 는 셋이 다 설 때의 값이다 (4.36 ⚠️) */}
        <div className="flex-1">
          <ApplyButton event={event} />
        </div>
      </div>
    </div>
  );
}
