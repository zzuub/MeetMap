import type { ReactNode } from "react";
import { cn } from "../lib/cn";

interface EmptyStateProps {
  /** 굵은 한 줄. 예: "조건에 맞는 소개팅이 없어요" */
  title: string;
  /** 다음 행동을 알려주는 보조 문구. 예: "필터를 조정해 다시 찾아보세요" */
  description?: string;
  /** 이모지·아이콘 등 시각 요소 */
  icon?: ReactNode;
  /** 하단 액션 버튼/칩 영역 */
  action?: ReactNode;
  className?: string;
}

/**
 * 공통 빈 상태 (11.2).
 *
 * 이 제품의 빈 상태는 "없다"로 끝내지 않고 **다음 행동을 제시한다**.
 * 검색 결과 없음 / 필터 결과 없음 / 찜 없음 / 비교함 없음 / 알림 없음이 전부 이 규칙을 따른다.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-14 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="flex size-14 items-center justify-center rounded-card bg-accent-soft text-2xl">
          {icon}
        </div>
      ) : null}

      <p className="text-[15px] font-bold text-text">{title}</p>

      {description ? (
        <p className="max-w-[280px] text-[13px] leading-5 text-text-sub">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-2 w-full max-w-[240px]">{action}</div> : null}
    </div>
  );
}
