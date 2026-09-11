"use client";

import type { ReactNode } from "react";
import { cn } from "@/shared/lib";
import { useSearchScreen } from "./SearchProvider";

/**
 * 커밋한 검색어의 응답을 기다리는 동안 본문을 흐린다 (`decisions.md` 4.66 표 4번).
 *
 * `loading.tsx` 는 이 자리를 대신하지 못한다 — 커밋이 `startTransition` 안의 이동이라
 * 이미 마운트된 경계가 유지되고 폴백이 뜨지 않는다(4.41 에서 탐색으로 확인한 것과 같다).
 */
export function SearchPending({ children }: { children: ReactNode }) {
  const { pending } = useSearchScreen();

  return (
    <div aria-busy={pending} className={cn("transition-opacity", pending && "opacity-50")}>
      {children}
    </div>
  );
}
