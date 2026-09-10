import { cn } from "../lib/cn";
import { formatErrorTimestamp } from "../lib/format";
import type { ActionFailure } from "./actionFailure";

/**
 * 제출 실패 알림 (11.2 · `decisions.md` 4.46).
 *
 * **토스트를 쓰지 않는다.** 2.5 의 토스트는 찜·비교처럼 성공을 스치듯 알리는
 * 자리이고, 1.8초 뒤 사라지는 알림에 CS 문의용 오류 코드를 실을 수 없다.
 * **비활성 라벨도 아니다** — 그건 사용자가 풀 수 있는 사유(미충족 입력)의 자리다.
 *
 * 재시도 버튼을 그리지 않는다. 폼의 제출 버튼이 그대로 재시도라, 하나 더 두면
 * 같은 일을 하는 버튼이 둘이 된다.
 */
export function FormErrorNotice({
  failure,
  className,
}: {
  failure: ActionFailure;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-card border border-border bg-accent-soft px-4 py-3 text-left",
        className,
      )}
    >
      <p className="text-[13px] font-bold text-text">{failure.title}</p>
      <p className="mt-0.5 text-[12px] leading-4 text-text-sub">
        {failure.description}
      </p>
      <p className="mt-1.5 text-[11px] text-text-sub/80">
        {failure.code} · {formatErrorTimestamp(new Date(failure.occurredAt))}
      </p>
    </div>
  );
}
