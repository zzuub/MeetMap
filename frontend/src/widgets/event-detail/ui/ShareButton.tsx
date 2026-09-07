"use client";

import { IconButton, useToast } from "@/shared/ui";

/**
 * 헤더의 `공유` (7.1 헤더 액션).
 *
 * 상세 URL 이 곧 공유 단위다 — 필터가 URL 에 실리는 탐색(2.4)과 같은 이유로,
 * 여기서도 화면 상태를 따로 만들지 않고 주소를 그대로 넘긴다.
 *
 * `navigator.share` 는 **모바일 사파리·크롬에만 있다.** 데스크톱 브라우저와
 * 비보안 컨텍스트에서는 없거나 막혀 있어 클립보드로 떨어뜨린다. 둘 다 안 되면
 * 조용히 실패하지 않고 토스트로 말한다 — 눌렀는데 아무 일도 안 일어나면 사용자는
 * 버튼이 고장 났는지 자기가 잘못 눌렀는지 알 수 없다.
 */
export function ShareButton({ title }: { title: string }) {
  const { showToast } = useToast();

  const share = async () => {
    const url = window.location.href;

    if (navigator.share) {
      // 사용자가 공유 시트를 닫으면 `AbortError` 로 거절된다. 취소는 실패가 아니다
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast("링크를 복사했어요");
    } catch {
      showToast("링크를 복사하지 못했어요");
    }
  };

  return (
    <IconButton label="공유" onClick={share}>
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path
          d="M12 3v12M12 3L8 7m4-4l4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );
}
