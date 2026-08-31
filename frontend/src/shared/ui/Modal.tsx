"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { useFocusTrap } from "../lib/useFocusTrap";
import { useIsClient } from "../lib/useIsClient";
import { useLockBodyScroll } from "../lib/useLockBodyScroll";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 하단 버튼 영역 (취소 / 확인하고 이동 등) */
  footer?: ReactNode;
  className?: string;
}

/**
 * 센터 모달 (2.5).
 *
 * 규격: `popIn 0.18s`, 딤 `rgba(16,28,38,0.42)`, 딤 클릭 시 닫힘,
 * 포커스 트랩 + Esc + 배경 스크롤 잠금 (15장).
 *
 * 주 사용처는 외부 신청 이동 확인 모달(7.3)이다. 그 화면은 법적 고지가 필수라
 * 닫기 경로는 열어두되 고지 내용을 건너뛰는 경로를 만들지 않는다.
 *
 * `Sheet` 와 같은 이유로 `document.body` 로 포털한다 — `position: fixed` 가
 * 조상의 `transform`/`filter`/`backdrop-filter` 에 갇히는 것을 막는다.
 * 이 모달은 행사 상세(히어로 이미지 + 고정 CTA) 위에서 열리므로 특히 중요하다.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // 포털 대상(document.body)은 서버에 없다. 하이드레이션 이후에만 렌더한다.
  const isClient = useIsClient();

  useLockBodyScroll(open);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !isClient) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 animate-dim-in bg-[var(--dim-modal)]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={cn(
          "relative flex w-full max-w-[360px] animate-pop-in flex-col",
          "max-h-[80vh] rounded-card bg-surface",
          className,
        )}
      >
        <h2
          id="modal-title"
          className="shrink-0 px-5 pt-5 pb-2 text-[17px] font-bold text-primary"
        >
          {title}
        </h2>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 text-[14px] leading-6 text-text-sub">
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 px-5 pt-1 pb-5">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
