"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { SortOption } from "@/entities/event";
import { DEFAULT_SORT } from "@/shared/config";
import { cn } from "@/shared/lib";
import { sortChoices } from "../model/sortChoices";
import type { ExploreParams } from "../model/exploreParams";

/**
 * 정렬 `select` (6.2). 결과 수 줄의 오른쪽, 뷰 토글 앞에 붙는다.
 *
 * **목적지는 `sortChoices` 가 만든다** — 여기서 `?sort=` 만 갈아끼우면 `eligibleOnly=0`
 * 이 떨어져 자격 필터가 기본값(ON)으로 되살아난다 (`decisions.md` 4.24·4.25).
 *
 * **전환 표시를 같이 붙인다.** 조건 변경은 트랜지션 안의 이동이라 `loading.tsx` 폴백이
 * 뜨지 않는다(4.41) — 고른 뒤 응답까지 목록이 그대로면 안 눌린 것처럼 보인다. 필터
 * 시트의 `N개 결과 보기` 와 같은 표시(흐려짐 + `aria-busy`)다.
 *
 * **지도 뷰에는 없다** — 정렬은 지도에서 보이는 것을 바꾸지 않아 누르면 아무 일도 없는
 * 컨트롤이 된다. 값은 URL 에 남아 리스트로 돌아오면 그 순서다 (`decisions.md` 4.71).
 */
export function SortSelect({ params }: { params: ExploreParams }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastPicked, setLastPicked] = useState<SortOption | null>(null);

  const choices = sortChoices(params);
  const selected = choices.find((choice) => choice.selected)?.code ?? DEFAULT_SORT;

  /**
   * 고른 값을 전환 중에만 붙잡는다. `selected` 는 URL 이 바뀌어야 따라오므로 그때까지
   * `select` 가 **이전 값으로 되돌아간 것처럼** 보인다.
   *
   * `pending` 이 내려가면 저절로 `selected` 로 돌아가므로 되돌리는 코드가 필요 없고,
   * 뒤로가기로 URL 이 바뀌어도 낡은 값이 남지 않는다 (시간대 칩과 같은 방식).
   */
  const shown = pending && lastPicked ? lastPicked : selected;

  function pick(code: string) {
    const choice = choices.find((item) => item.code === code);
    if (!choice) return;

    setLastPicked(choice.code);
    startTransition(() => router.replace(choice.href, { scroll: false }));
  }

  return (
    <div className="relative shrink-0">
      <select
        aria-label="정렬"
        aria-busy={pending}
        value={shown}
        onChange={(event) => pick(event.target.value)}
        className={cn(
          "min-h-[34px] appearance-none rounded-chip border border-border bg-surface",
          "py-1 pl-3 pr-7 text-[13px] font-semibold text-text-sub transition-opacity",
          pending && "opacity-40",
        )}
      >
        {choices.map((choice) => (
          <option key={choice.code} value={choice.code}>
            {choice.label}
          </option>
        ))}
      </select>

      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className={cn(
          "pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-text-sub",
          "transition-opacity",
          pending && "opacity-40",
        )}
      >
        <path
          d="M6 9l6 6 6-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
