"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useTransition,
  type ReactNode,
} from "react";
import { useToast } from "@/shared/ui";
import { LIKE_FAILED_TOAST, LIKE_TOAST, type LikeResult } from "../model/copy";
import { toggleLikedId } from "../model/likedIds";

interface LikeContextValue {
  isLiked: (eventId: string) => boolean;
  toggle: (eventId: string) => void;
  /** 로그인하지 않았으면 버튼이 로그인으로 보낸다 (2.4 `찜 … 로그인 필요`) */
  signInHref: string | null;
}

const LikeContext = createContext<LikeContextValue | null>(null);

/**
 * 찜 상태를 **화면 하나에 하나만** 둔다 (2.4 / 9장 · `decisions.md` 4.59).
 *
 * ## 왜 버튼마다가 아니라 화면마다인가
 *
 * 홈은 같은 회차가 **섹션 셋에 겹쳐 뜬다** — 눌러서 확인했다(`evt-002` 가 둘,
 * `evt-003` 이 셋). 버튼이 각자 상태를 들면 하나를 눌렀을 때 나머지가 안 바뀌어
 * **같은 화면에 서로 다른 답**이 그려진다.
 *
 * ## 왜 TanStack Query 가 아닌가
 *
 * dev-plan blocking #6 의 기본안을 뒤집었다 → 4.58. 요약하면 이 리포에
 * **클라이언트 캐시가 필요한 자리가 없다** — 목록은 RSC 가 그리고, 갱신은
 * `revalidatePath` 가 하고, 낙관은 `useOptimistic` 이 한다.
 *
 * ## 되돌리기 코드가 없는 것이 정상이다
 *
 * `useOptimistic` 의 기준값이 **서버에서 온 `liked` prop** 이다. 실패하면 낙관값만
 * 걷히고 서버 값(=바뀌지 않은 값)이 드러난다 — 화면이 제자리로 돌아오는 것을
 * 코드가 아니라 구조가 보장한다.
 */
export function LikeProvider({
  liked,
  signInHref = null,
  toggleLike,
  children,
}: {
  /** 서버가 읽은 찜 id. **이 화면의 기준값**이다 */
  liked: readonly string[];
  /** 게스트면 여기로 보낸다. 로그인 사용자는 `null` */
  signInHref?: string | null;
  toggleLike: (eventId: string, next: boolean) => Promise<LikeResult>;
  children: ReactNode;
}) {
  const { showToast } = useToast();
  const [, startTransition] = useTransition();

  // 리듀서는 떼어 테스트한다 — 찜 목록이 이 결과로 카드를 지운다 (`decisions.md` 4.64)
  const [optimistic, apply] = useOptimistic(liked, toggleLikedId);

  // 매 렌더 새 `Set` 을 만들지 않는다 — 카드가 수십 장이면 조회가 그만큼 돈다
  const likedSet = useMemo(() => new Set(optimistic), [optimistic]);

  const toggle = useCallback(
    (eventId: string) => {
      const next = !likedSet.has(eventId);

      // ⚠️ `useOptimistic` 의 갱신은 **transition 안에서만** 허용된다
      startTransition(async () => {
        apply(eventId);
        // ⚠️ **이 토스트를 transition 밖으로 빼지 않는다.** 안에 있어서 액션이 끝난
        // 뒤에 커밋되고, 그래서 **결과 확인**이 된다. 늦다고 밖으로 빼면 느린
        // 실패에서 `저장했어요` 가 1.8초 뒤 사라지고 한참 뒤 `저장하지 못했어요` 가
        // 따로 뜬다 — 서로 이어지지 않는 두 문구다 (`decisions.md` 4.61)
        showToast(next ? LIKE_TOAST.liked : LIKE_TOAST.unliked);

        const result = await toggleLike(eventId, next);
        if (result.ok) return;

        showToast(LIKE_FAILED_TOAST);
        console.warn(
          `[like] 찜 저장 실패 — ${result.failure.code} · ${result.failure.occurredAt}`,
        );
      });
    },
    [apply, likedSet, showToast, toggleLike],
  );

  const value = useMemo(
    () => ({ isLiked: (id: string) => likedSet.has(id), toggle, signInHref }),
    [likedSet, toggle, signInHref],
  );

  return <LikeContext.Provider value={value}>{children}</LikeContext.Provider>;
}

export function useLike(): LikeContextValue {
  const context = useContext(LikeContext);
  if (!context) {
    throw new Error("useLike 는 LikeProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
