import type { EventDetail } from "@/entities/event";
import { DetailSection } from "./DetailSection";

/**
 * 참석자 리스트 원본 아웃링크 (7.2).
 *
 * **집계값은 정보 카드가 이미 쓴다** — 이 블록이 더하는 것은 동의한 주최사의 원본
 * 링크뿐이고, 동의가 없으면 통째로 없다 (`decisions.md` 4.33).
 *
 * ⚠️ **리스트를 가져와 그리지 않는다** — 이미지 게재도, 사실만 뽑아 개별 행으로
 * 재구성하는 것도 금지다 (7.2 원칙 표). 확인 모달을 안 거치는 것은 신청·결제가
 * 아니어서다 (7.4 인스타 아웃링크와 같은 취급). 신청은 P1-8 모달을 반드시 거친다.
 */
export function AttendeeListBlock({ event }: { event: EventDetail }) {
  if (!event.attendeeListUrl) return null;

  return (
    <DetailSection title="참석자 리스트">
      <div className="rounded-card border border-border bg-surface px-4 py-3.5">
        <p className="text-[13px] leading-5 text-text-sub">
          MeetMap 은 참석자를 연령대·직업군·정원 집계로만 다뤄요. 원본 리스트는
          주최사 게시물에서 볼 수 있어요.
        </p>

        <a
          href={event.attendeeListUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-[14px] font-bold text-primary underline underline-offset-4"
        >
          주최사 게시물에서 보기
          <span aria-hidden>↗</span>
          <span className="sr-only">새 탭에서 열림</span>
        </a>
      </div>
    </DetailSection>
  );
}
