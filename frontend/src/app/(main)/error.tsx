"use client";

import { RetryErrorCard } from "@/shared/ui";

/**
 * 하단 탭 화면들의 에러 경계 (11.2).
 *
 * **`(main)/layout.tsx` 안에서 렌더된다** — `error.tsx` 는 같은 세그먼트의 레이아웃을
 * 감싸지 않기 때문에 하단 탭이 그대로 남는다. 남겨야 한다: 실패한 것은 이 화면의
 * 조회 하나이고 다른 세 탭은 멀쩡한데, 탭까지 지우면 `다시 시도` 말고는 나갈 길이
 * 없는 화면이 된다 (`decisions.md` 4.40).
 *
 * ⚠️ **여기는 11.2 의 에러 카드가 아니다.** 클라이언트 컴포넌트라 서버가 던진
 * `ApiError` 의 `code`·`occurredAt`·`retryable` 이 프로덕션에서 경계를 못 넘는다.
 * 조회 실패는 페이지가 직접 잡아 진짜 카드를 그리고(`RetryErrorCard`), 여기로 오는
 * 것은 **그 밖의 예외** — 렌더 중 버그다. 식별자는 Next 가 서버 로그와 맞춰 주는
 * `digest` 뿐이다.
 */
export default function MainError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="px-5 py-16">
      <RetryErrorCard
        title="화면을 열지 못했어요"
        description="잠시 후 다시 시도해주세요. 문제가 계속되면 아래 코드로 문의해주세요"
        code={error.digest}
        retry={retry}
      />
    </div>
  );
}
