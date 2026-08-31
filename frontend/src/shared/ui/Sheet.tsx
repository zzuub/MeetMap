"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/cn";
import { useFocusTrap } from "../lib/useFocusTrap";
import { useIsClient } from "../lib/useIsClient";
import { useLockBodyScroll } from "../lib/useLockBodyScroll";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** 하단 고정 액션 영역 (예: `N개 결과 보기`) */
  footer?: ReactNode;
  /** 기본 82vh. 필터 시트 82vh / 프로필 시트 78vh (3.4 / 6.4) */
  maxHeight?: string;
  className?: string;
}

/**
 * 바텀 시트 (2.5).
 *
 * 규격: `sheetUp 0.2s`, 딤 `rgba(16,28,38,0.38)`, 딤 클릭 시 닫힘,
 * 그랩 핸들 36×4px, 포커스 트랩 + Esc + 배경 스크롤 잠금 (15장).
 *
 * **`document.body` 로 포털한다.** `position: fixed` 는 조상에 `transform` /
 * `filter` / `backdrop-filter` / `contain` / `will-change` 가 하나라도 있으면
 * 뷰포트가 아니라 **그 조상** 기준으로 컨테이닝 블록이 잡힌다. 제자리에 렌더하면
 * 지도 컨테이너나 카드 hover scale 같은 게 위에 생기는 순간 시트가 그 안에 갇히고,
 * 원인이 상속 체인 저 위에 있어 추적이 매우 어렵다.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  maxHeight = "82vh",
  className,
}: SheetProps) {
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
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 딤. 클릭 시 닫힘 (2.5) */}
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="absolute inset-0 animate-dim-in bg-[var(--dim-sheet)]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        style={{ maxHeight }}
        className={cn(
          "relative flex w-full max-w-shell animate-sheet-up flex-col",
          "rounded-t-sheet bg-surface pb-[env(safe-area-inset-bottom)]",
          className,
        )}
      >
        {/* 그랩 핸들 36×4 (2.5) */}
        <div className="flex shrink-0 justify-center pt-2.5 pb-1">
          <span aria-hidden className="h-1 w-9 rounded-chip bg-border" />
        </div>

        <header className="flex shrink-0 items-center justify-between px-5 pt-2 pb-3">
          <h2 className="text-[17px] font-bold text-primary">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="-mr-2 flex size-11 items-center justify-center rounded-chip text-text-sub hover:bg-accent-soft"
          >
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">{children}</div>

        {footer ? (
          <div className="shrink-0 border-t border-border px-5 py-3">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
