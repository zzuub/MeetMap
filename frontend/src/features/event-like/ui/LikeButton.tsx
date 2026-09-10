"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib";
import { IconButton } from "@/shared/ui";
import { likeLabel } from "../model/copy";
import { useLike } from "./LikeProvider";

/**
 * 찜 버튼 (5.3 카드 우하단 · 6.5 · 7.2 하단 CTA 원형).
 *
 * ⚠️ **카드 클릭과 분리한다** — 카드는 stretched link 라(4.16) 버튼이 그 안에 있으면
 * 누를 때마다 상세로 간다. `stopPropagation` 만으로는 부족하고 **`preventDefault`
 * 까지** 해야 앵커의 기본 동작이 안 돈다.
 *
 * ⚠️ **히트 영역은 `IconButton` 이 보장한다.** 15장이 찜 버튼을 이름으로 지목했다 —
 * `현재 26~30px → 확대 또는 히트영역 확장 필요`. 시각적 원은 그보다 작게 안에 둔다.
 *
 * **게스트는 로그인으로 보낸다** (2.4 `찜 … 로그인 필요`). 버튼을 숨기지 않는 이유는
 * 누르면 실제로 다음 걸음이 있기 때문이다 — `누르면 아무 일 없는 컨트롤`(4.29)이 아니다.
 *
 * 하트는 `--color-point`(테라코타) 전용 자리다 (2.2).
 */
export function LikeButton({
  eventId,
  size = "default",
  className,
}: {
  eventId: string;
  /** `default` 카드 우하단 · `cta` 상세 하단 고정 (7.2) */
  size?: "default" | "cta";
  className?: string;
}) {
  const { isLiked, toggle, signInHref } = useLike();
  const router = useRouter();
  const liked = isLiked(eventId);

  return (
    <IconButton
      label={likeLabel(liked)}
      aria-pressed={liked}
      size={size}
      className={cn("hover:bg-transparent", className)}
      onClick={(event) => {
        // 카드 전체가 링크다. 둘 다 해야 상세로 새지 않는다
        event.preventDefault();
        event.stopPropagation();

        if (signInHref) {
          router.push(signInHref);
          return;
        }
        toggle(eventId);
      }}
    >
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full border transition-colors",
          size === "cta" ? "size-12" : "size-9",
          liked
            ? "border-point/40 bg-point/10"
            : "border-border bg-surface/90 backdrop-blur-[2px]",
        )}
      >
        <HeartIcon filled={liked} className={size === "cta" ? "size-6" : "size-[18px]"} />
      </span>
    </IconButton>
  );
}

/** 채움/테두리 두 상태. 색만으로 구분하지 않도록 **모양도 바뀐다** (15장) */
function HeartIcon({ filled, className }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("text-point", className)}>
      <path
        d="M12 20.2l-1.4-1.3C6 14.9 3.3 12.4 3.3 9.3 3.3 6.9 5.2 5 7.6 5c1.4 0 2.7.6 3.5 1.7l.9 1.1.9-1.1C13.7 5.6 15 5 16.4 5 18.8 5 20.7 6.9 20.7 9.3c0 3.1-2.7 5.6-7.3 9.6L12 20.2z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={filled ? 0 : 1.8}
        strokeLinejoin="round"
      />
    </svg>
  );
}
