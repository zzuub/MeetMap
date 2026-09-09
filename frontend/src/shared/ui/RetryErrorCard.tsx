"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
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
 * 11.2 에러 카드에 **재시도 동작을 붙이는 얇은 클라이언트 껍데기**.
 *
 * `ErrorState` 는 `onRetry` 가 돌려주는 프로미스가 끝날 때까지 라벨을
 * `다시 시도하는 중...` 으로 바꾼다(11.2). 그런데 여기서 부를 두 재시도
 * (`router.refresh()` · Next 의 `retry()`)는 **둘 다 완료를 알려주지 않는다** —
 * 동기 함수이고, 끝나는 시점은 `useTransition` 의 `pending` 이 내려가는 순간이다.
 * 그 둘을 잇는 것이 이 파일의 전부다. `ErrorState` 는 손대지 않는다.
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

  /** 진행 중인 재시도의 완료 신호. `pending` 이 내려갈 때 호출한다 */
  const settle = useRef<(() => void) | null>(null);

  /*
    **의존성 배열이 없는 것은 의도다.** `[pending]` 으로 두면 트랜지션이 동기적으로
    끝나 `pending` 이 한 번도 `true` 가 되지 않는 경우 effect 가 다시 돌지 않아
    프로미스가 영원히 안 풀린다 — 버튼이 `다시 시도하는 중...` 에서 멈춘다.
    `ErrorState` 가 재시도를 시작하면서 자기 상태를 바꿔 렌더를 한 번 보장하므로,
    매 렌더에 확인하면 두 경우 모두 정확히 한 번 풀린다.
  */
  useEffect(() => {
    if (pending || settle.current === null) return;
    const resolve = settle.current;
    settle.current = null;
    resolve();
  });

  if (retry === false) {
    return (
      <ErrorState
        title={title}
        description={description}
        code={code}
        occurredAt={occurredAt}
        className={className}
      />
    );
  }

  const run = retry === "refresh" ? () => router.refresh() : retry;

  return (
    <ErrorState
      title={title}
      description={description}
      code={code}
      occurredAt={occurredAt}
      className={className}
      onRetry={() =>
        new Promise<void>((resolve) => {
          // 트랜지션을 걸기 **전에** 꽂는다. 동기적으로 끝나는 재시도라도
          // effect 가 신호를 놓치지 않는다.
          settle.current = resolve;
          startTransition(run);
        })
      }
    />
  );
}
