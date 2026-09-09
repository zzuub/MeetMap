"use client";

import {
  BirthYearRangeText,
  CapacityText,
  PriceText,
  eventApi,
  type EventDetail,
} from "@/entities/event";
import { Modal, PrimaryButton } from "@/shared/ui";
import { OUTBOUND_COPY } from "../model/copy";

/**
 * 외부 신청 이동 확인 모달 (7.3) — **이 제품의 핵심 정책 화면**.
 *
 * MeetMap 은 결제를 대행하지 않는 중개 플랫폼이다. 고지·조건 확인 블록·하단
 * 경고는 **타협 불가**이고, 이 모달을 거치지 않고 `externalApplyUrl` 로 가는
 * 경로를 만들지 않는다 (P3-2 마커 시트의 신청 버튼도 포함).
 *
 * 마감 회차에도 **막지 않고 알린다** — `decisions.md` 4.37.
 */
export function ApplyOutboundModal({
  event,
  open,
  onClose,
}: {
  event: EventDetail;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title={OUTBOUND_COPY.title} footer={<Footer event={event} onClose={onClose} />}>
      <OutboundNoticeBody event={event} />
    </Modal>
  );
}

/** 본문이 쓰는 값. 7.3 조건 확인 블록의 세 행 + 마감 여부가 전부다 */
export type OutboundNoticeEvent = Pick<
  EventDetail,
  | "status"
  | "birthYearFrom"
  | "birthYearTo"
  | "maleCapacity"
  | "femaleCapacity"
  | "malePrice"
  | "femalePrice"
>;

/**
 * 모달 본문 — 법적 고지 · 마감 안내 · 조건 확인 블록 · 하단 경고 (7.3 필수 전부).
 *
 * **`Modal` 밖으로 떼어 둔 것은 렌더 결과를 잠그기 위해서다.** `Modal` 은
 * `document.body` 로 포털하고 `useIsClient` 로 서버 렌더를 건너뛰어
 * `renderToStaticMarkup` 이 빈 문자열을 준다. 본문만 순수 컴포넌트로 떼면 jsdom
 * 없이(4.10) **고지가 실제로 그려지는지** 테스트할 수 있다 (`decisions.md` 4.38).
 */
export function OutboundNoticeBody({ event }: { event: OutboundNoticeEvent }) {
  return (
    <>
      <p className="font-bold text-text">{OUTBOUND_COPY.notice}</p>

      {event.status === "마감" ? (
        <p className="mt-3 rounded-button bg-accent-soft px-3 py-2.5 text-[13px] leading-5 text-text">
          {OUTBOUND_COPY.closedNotice}
        </p>
      ) : null}

      <ConditionBlock event={event} />

      <p className="mt-3 text-[13px] leading-5 text-warning">{OUTBOUND_COPY.warning}</p>
    </>
  );
}

/**
 * 조건 확인 블록 (7.3 필수).
 *
 * 세 행의 **구성이 7.3 에 고정돼 있다** — 상세의 정보 카드(7.1)가 행을 늘리거나
 * 순서를 바꿔도 여기는 따라가지 않는다. 값을 그리는 조각만 같은 것을 쓴다.
 */
function ConditionBlock({ event }: { event: OutboundNoticeEvent }) {
  return (
    <section className="mt-3 rounded-button border border-border px-3 py-2.5">
      <h3 className="text-[13px] font-bold text-text">{OUTBOUND_COPY.conditionsHeading}</h3>

      <dl className="mt-2 flex flex-col gap-1.5 text-[13px]">
        <Row label="참가 연령">
          <BirthYearRangeText
            birthYearFrom={event.birthYearFrom}
            birthYearTo={event.birthYearTo}
            className="font-bold text-text"
          />
        </Row>
        <Row label="모집 정원">
          <CapacityText
            maleCapacity={event.maleCapacity}
            femaleCapacity={event.femaleCapacity}
            className="font-bold text-text"
          />
        </Row>
        {/* 남·여 양쪽 표기가 7.3 의 요구다. `null` 은 게스트라서가 아니라 이 자리의 규칙 */}
        <Row label="참가비">
          <PriceText
            malePrice={event.malePrice}
            femalePrice={event.femalePrice}
            gender={null}
            className="font-bold text-text"
          />
        </Row>
      </dl>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="shrink-0 text-text-sub">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

/**
 * `확인하고 이동` 은 **버튼이 아니라 `<a>`** 다.
 *
 * 로깅을 `await` 한 뒤 `window.open` 을 부르면 사용자 제스처와의 연결이 끊겨
 * **팝업 차단에 걸린다.** 앵커를 쓰면 브라우저가 탭을 직접 열므로 로깅 결과와
 * 무관하게 이동이 보장된다 — `logOutboundClick` 은 실패해도 흐름을 막지 않는다는
 * 계약(`ports.ts`)을 코드 모양으로 지키는 것이다.
 */
function Footer({ event, onClose }: { event: EventDetail; onClose: () => void }) {
  return (
    <div className="flex gap-2">
      <PrimaryButton variant="secondary" onClick={onClose} className="flex-1">
        {OUTBOUND_COPY.cancel}
      </PrimaryButton>

      <a
        href={event.externalApplyUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          void eventApi.logOutboundClick(event.id).catch(() => {});
          onClose();
        }}
        className="inline-flex min-h-[48px] flex-[1.4] items-center justify-center rounded-button bg-accent px-5 text-[15px] font-bold text-text transition-colors hover:bg-active"
      >
        {OUTBOUND_COPY.confirm}
      </a>
    </div>
  );
}
