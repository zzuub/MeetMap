"use client";

import { RetryErrorCard } from "@/shared/ui";
import { AppHeader } from "@/widgets/app-header";

/**
 * 스택 화면들의 에러 경계 (11.2).
 *
 * ⚠️ **`AppHeader` 를 여기서 직접 그린다.** `(stack)/layout.tsx` 는 폭·배경만 맡고
 * 헤더는 각 페이지가 그리기로 되어 있어서, 그리지 않으면 이 화면에는 하단 탭도
 * 헤더도 없는 — **나갈 수단이 하나도 없는** 상태가 된다 (`decisions.md` 4.40).
 *
 * 타이틀 없는 `AppHeader` 라 이 화면이 `h1` 을 진다 (4.34). 에러 카드의 제목을
 * `h1` 으로 바꾸면 `ErrorState` 가 자리마다 다른 태그를 내야 하므로, 보이는 제목은
 * 카드에 두고 문서 구조만 여기서 맞춘다.
 *
 * `error.tsx` 가 무엇을 받고 무엇을 못 받는지는 `(main)/error.tsx` 와 같다.
 */
export default function StackError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <>
      <AppHeader />
      <h1 className="sr-only">화면을 열지 못했어요</h1>

      <div className="px-5 py-16">
        <RetryErrorCard
          title="화면을 열지 못했어요"
          description="잠시 후 다시 시도해주세요. 문제가 계속되면 아래 코드로 문의해주세요"
          code={error.digest}
          retry={retry}
        />
      </div>
    </>
  );
}
