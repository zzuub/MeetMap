"use client";

import { useSyncExternalStore } from "react";
import {
  recentKeywordsStore,
  type RecentKeywordsSnapshot,
} from "../model/recentKeywordsStore";

/**
 * 최근 검색어 스냅샷. 서버 렌더와 하이드레이션 첫 패스는 `unknown` 이고 그다음에 읽는다 —
 * `useIsClient` 와 같은 장치라 하이드레이션 불일치가 없다 (`decisions.md` 4.69).
 */
export function useRecentKeywords(): RecentKeywordsSnapshot {
  return useSyncExternalStore(
    recentKeywordsStore.subscribe,
    recentKeywordsStore.getSnapshot,
    recentKeywordsStore.getServerSnapshot,
  );
}
