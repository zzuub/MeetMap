"use client";

import { RetryErrorCard } from "@/shared/ui";

/**
 * 최후 방어선 (11.2).
 *
 * 그룹 `error.tsx` 가 **못 잡는 자리**를 받는다 — `(main)`·`(stack)`·`(onboarding)`
 * **레이아웃 자체**가 던진 예외다. `error.tsx` 는 같은 세그먼트의 레이아웃을
 * 감싸지 않는다.
 *
 * 원래 한 줄이 더 있었다: `(onboarding)` 이 자리표시자 한 장뿐이라 자기 경계를
 * 두지 않았다. **P2-1 이 화면 5개를 만들면서 붙였다** (`decisions.md` 4.47).
 *
 * 셸이 없으므로 폭·배경을 직접 잡는다 — 루트 레이아웃은 프로바이더만 얹는다.
 * 루트 레이아웃 자체가 던지면 여기로도 안 오고 `global-error` 만 받는데, 그 파일은
 * `<html>`·전역 스타일을 다시 들여야 해 성격이 다르다. 지금 루트 레이아웃은 조회가
 * 없어 만들지 않는다 (`decisions.md` 4.40).
 */
export default function RootError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-shell flex-col justify-center bg-bg px-5">
      <h1 className="sr-only">화면을 열지 못했어요</h1>

      <RetryErrorCard
        title="화면을 열지 못했어요"
        description="잠시 후 다시 시도해주세요. 문제가 계속되면 아래 코드로 문의해주세요"
        code={error.digest}
        retry={retry}
      />
    </div>
  );
}
