"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/lib";

interface EventThumbnailProps {
  /** `null`·빈 문자열이면 이미지가 없는 것이다 (이미지 사용 미동의) */
  src: string | null;
  /**
   * 대체 표시에 쓰는 이름. 주최사명을 넘긴다.
   * 폭이 좁은 썸네일(62~92px)에서는 자리가 없어 표시하지 않는다.
   */
  label: string;
  /** `fill` 을 쓰므로 필수다. 없으면 next/image 가 뷰포트 폭으로 계산한다 */
  sizes: string;
  className?: string;
}

/**
 * 카드 썸네일.
 *
 * **이미지가 없는 것은 오류가 아니라 정상 경로다** — 이미지 사용 동의를 주지 않은
 * 주최사가 실재한다 (7.2 · `progress.md` 4.18). 두 갈래를 같은 대체 표시로 받는다.
 * `null` 은 **요청 자체를 보내지 않고**, 로드 실패는 `onError` 로 잡는다.
 */
export function EventThumbnail({ src, label, sizes, className }: EventThumbnailProps) {
  const [failed, setFailed] = useState(false);
  const showFallback = !src || failed;

  return (
    <div className={cn("relative shrink-0 overflow-hidden bg-accent-soft", className)}>
      {showFallback ? (
        <Fallback label={label} />
      ) : (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

/** 토큰만 쓴다. `--color-accent` 계열은 항상 짙은 글자와 짝짓는다 (2.2) */
const TONES = [
  "bg-accent-soft text-secondary",
  "bg-active text-primary/55",
  "bg-border text-primary/50",
  "bg-secondary/20 text-primary/55",
] as const;

function Fallback({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        // 컨테이너 쿼리로 자기 폭을 본다. 62~92px 썸네일에는 이름을 넣을 자리가 없다
        "@container flex size-full flex-col items-center justify-center gap-1",
        toneFor(label),
      )}
    >
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
        <path
          d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="10" r="2.2" fill="none" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span className="hidden max-w-full truncate px-2 text-[11px] font-bold @min-[120px]:block">
        {label}
      </span>
    </div>
  );
}

/**
 * 이름으로 톤을 정한다 — 이미지 없는 카드가 여러 장 이어질 때 전부 같은 회색
 * 상자면 구분되지 않는다. 순수 함수라 하이드레이션에 안전하다.
 */
function toneFor(label: string): string {
  let sum = 0;
  for (let i = 0; i < label.length; i += 1) sum += label.charCodeAt(i);
  return TONES[sum % TONES.length];
}
