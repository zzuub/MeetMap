"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { ErrorState } from "./ErrorState";

interface RetryErrorCardProps {
  title?: string;
  description?: string;
  /** 예: `NET_TIMEOUT_504` 또는 `error.digest` */
  code?: string;
  /** `ApiError.occurredAt`. 경계를 못 넘는 자리(`error.tsx`)에서는 없다 */
  occurredAt?: Date;
  /**
   * 재시도 동작.
   *
   * - `"refresh"` — 라우터 새로고침. **서버 컴포넌트가 넘길 수 있는 유일한 값**이다
   *   (함수는 RSC 경계를 못 넘는다).
   * - 함수 — `error.tsx` 가 받은 Next 의 `retry` 를 그대로 넘기는 자리.
   * - `false` — 재시도 버튼을 그리지 않는다. `ApiError.retryable` 이 거짓인 실패다.
   */
  retry: "refresh" | (() => void) | false;
  className?: string;
}

/**
 * 11.2 에러 카드에 **라우터 재시도를 붙이는 얇은 클라이언트 껍데기**.
 *
 * 여기서 부를 두 재시도(`router.refresh()` 와 Next 의 `retry()`)는 **동기 함수라
 * 완료를 알려주지 않는다.** 끝나는 시점은 `useTransition` 의 `pending` 이 내려가는
 * 순간이므로, 그 값을 `ErrorState` 의 제어형 `retrying` 으로 그대로 넘긴다 —
 * 11.2 가 요구하는 `다시 시도하는 중...` 라벨이 응답까지 유지된다.
 *
 * ⚠️ **`고객센터 문의` 를 그리지 않는다.** 11.2 는 요구하지만 Phase 1 에는 문의
 * 목적지가 없다(마이페이지 10.1 이 자리표시자다). 누르면 아무 일도 없는 컨트롤을
 * 만들지 않는다는 규칙(5.4)이 여기에도 걸린다 → `decisions.md` 4.40.
 * P4-1 이 문의 경로를 만들 때 `onContactSupport` 를 채운다.
 */
export function RetryErrorCard({
  title,
  description,
  code,
  occurredAt,
  retry,
  className,
}: RetryErrorCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = retry === false ? null : retry === "refresh" ? () => router.refresh() : retry;

  return (
    <ErrorState
      title={title}
      description={description}
      code={code}
      occurredAt={occurredAt}
      className={className}
      onRetry={run === null ? undefined : () => startTransition(run)}
      retrying={pending}
    />
  );
}
