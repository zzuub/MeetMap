"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cn } from "@/shared/lib";
import { SegmentedControl } from "@/shared/ui";
import type { ExploreParams, ExploreView } from "../model/exploreParams";
import { viewChoices } from "../model/viewChoices";

/**
 * 뷰 토글 `리스트 / 지도` (6.2). 결과 수 줄의 오른쪽에 붙는다.
 *
 * **`replace` 다** (2.4) — 렌즈를 바꾼 것이 뒤로가기 한 칸이 되면 리스트↔지도를 몇 번 오간
 * 사용자가 탐색을 나가는 데 그만큼 눌러야 한다. 칩·정렬과 같은 규칙이다.
 *
 * 고른 쪽을 전환 중에 붙잡는다 — `params.view` 는 URL 이 바뀌어야 따라오므로 그 사이
 * 세그먼트가 되돌아간 것처럼 보인다 (`SortSelect` 와 같은 방식).
 */
export function ViewToggle({ params }: { params: ExploreParams }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [lastPicked, setLastPicked] = useState<ExploreView | null>(null);

  const choices = viewChoices(params);
  const shown = pending && lastPicked ? lastPicked : params.view;

  function pick(view: ExploreView) {
    const choice = choices.find((item) => item.value === view);
    if (!choice || choice.selected) return;

    setLastPicked(view);
    startTransition(() => router.replace(choice.href));
  }

  return (
    <div aria-busy={pending} className={cn("shrink-0 transition-opacity", pending && "opacity-60")}>
      <SegmentedControl label="보기 방식" options={choices} value={shown} onChange={pick} />
    </div>
  );
}
