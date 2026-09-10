"use client";

import { ActionLink, RetryErrorCard } from "@/shared/ui";

/**
 * 온보딩 셸의 에러 경계 (11.2).
 *
 * 4.41 이 "자리표시자 한 장뿐이라 자기 경계를 두지 않았다 — P2-1 이 실제 화면을
 * 만들 때 붙인다"고 적어 둔 자리다. 다만 **경계를 만드는 근거는 화면 수가 아니라
 * 출구**다 (`decisions.md` 4.47).
 *
 * `(main)` 은 하단 탭이, `(stack)` 은 헤더가 출구라 각자 자기 error 에 그것을
 * 그린다. **온보딩은 그릴 크롬이 없는 유일한 셸이다** — 퍼널이라 탭도 헤더도
 * 일부러 없앴다. 그래서 출구를 에러 카드가 직접 준다.
 *
 * `error.tsx` 가 무엇을 받고 무엇을 못 받는지는 `(main)/error.tsx` 와 같다 —
 * 조회 실패는 페이지가 `loadOrError` 로 잡고, 여기 오는 것은 렌더 중 예외다 (4.40).
 * 제출 실패(Server Action)도 여기로 오지 않는다 — 폼이 직접 잡는다 (4.46).
 */
export default function OnboardingError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col justify-center gap-4 px-5">
      <h1 className="sr-only">화면을 열지 못했어요</h1>

      <RetryErrorCard
        title="화면을 열지 못했어요"
        description="잠시 후 다시 시도해주세요. 문제가 계속되면 아래 코드로 문의해주세요"
        code={error.digest}
        retry={retry}
      />

      {/* 가입을 마치지 못해도 탐색은 게스트에게 열려 있다 (dev-plan 3.5) */}
      <div className="mx-auto w-full max-w-[320px]">
        <ActionLink href="/">홈으로 가기</ActionLink>
      </div>
    </main>
  );
}
