"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "../lib/cn";
import { formatErrorTimestamp } from "../lib/format";
import { PrimaryButton } from "./PrimaryButton";

interface ErrorStateProps {
  title?: string;
  description?: string;
  /** 예: `NET_TIMEOUT_504`. CS 문의 시 식별자로 쓰인다. */
  code?: string;
  /**
   * 오류 발생 시각. `ApiError.occurredAt` 을 그대로 넘긴다.
   * 렌더 시각으로 대체하지 않는다 — SSR/CSR 값이 달라 하이드레이션이 깨지고,
   * "언제 실패했는지"가 아니라 "언제 화면을 그렸는지"가 되어 CS 식별자로 못 쓴다.
   */
  occurredAt?: Date;
  onRetry?: () => void | Promise<void>;
  onContactSupport?: () => void;
  className?: string;
}

/**
 * 공통 에러 상태 (11.2).
 *
 * **오류 코드와 발생 시각을 노출하는 것이 이 제품의 규칙이다.** CS 문의 시 식별자로 쓰기
 * 때문에 "일시적인 오류가 발생했습니다" 같은 뭉뚱그린 문구로 대체하지 않는다.
 *
 * 재시도 버튼은 진행 중 라벨·스타일이 바뀐다 (`다시 시도하는 중...`).
 */
export function ErrorState({
  title = "연결이 불안정해요",
  description = "네트워크 상태를 확인한 뒤 다시 시도해주세요",
  code,
  occurredAt,
  onRetry,
  onContactSupport,
  className,
}: ErrorStateProps) {
  const [retrying, setRetrying] = useState(false);

  // 재시도 중 화면을 벗어나면(라우팅·조건부 언마운트) 응답이 돌아왔을 때
  // 사라진 컴포넌트에 setState 하게 된다. 마운트 여부를 확인하고 넘긴다.
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      if (mountedRef.current) setRetrying(false);
    }
  };

  return (
    <div
      role="alert"
      className={cn(
        "mx-auto flex max-w-[320px] flex-col items-center gap-3 rounded-card",
        "border border-border bg-surface px-6 py-10 text-center",
        className,
      )}
    >
      <div className="flex size-14 items-center justify-center rounded-card bg-accent-soft text-2xl">
        ⚠️
      </div>

      <p className="text-[15px] font-bold text-text">{title}</p>
      <p className="text-[13px] leading-5 text-text-sub">{description}</p>

      {code ? (
        <p className="text-[11px] text-text-sub/80">
          {code}
          {occurredAt ? ` · ${formatErrorTimestamp(occurredAt)}` : null}
        </p>
      ) : null}

      <div className="mt-2 flex w-full flex-col gap-2">
        {onRetry ? (
          <PrimaryButton
            onClick={handleRetry}
            disabled={retrying}
            variant={retrying ? "ghost" : "primary"}
          >
            {retrying ? "다시 시도하는 중..." : "다시 시도"}
          </PrimaryButton>
        ) : null}

        {onContactSupport ? (
          <PrimaryButton variant="ghost" onClick={onContactSupport}>
            고객센터 문의
          </PrimaryButton>
        ) : null}
      </div>
    </div>
  );
}
