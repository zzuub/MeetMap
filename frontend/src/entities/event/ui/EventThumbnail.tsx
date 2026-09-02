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
 * **이미지가 없는 것은 오류가 아니라 정상 경로다.** 주최사 등록은 동의 기반이고
 * 동의 범위가 `정보 등록` / `이미지 사용` / `참석자 리스트 표시` 로 나뉘어(7.2),
 * 정보만 허락하고 이미지는 주지 않는 주최사가 실제로 있다. 이미지가 없다고
 * 소개팅을 목록에서 빼면 컨택이 덜 진행된 주최사의 소개팅이 통째로 사라진다.
 *
 * 그래서 두 갈래를 같은 대체 표시로 떨어뜨린다.
 * - `thumbnailUrl === null` — 이미지 사용 동의 없음. **요청 자체를 보내지 않는다**
 * - 로드 실패 — 원본이 내려갔거나 URL 이 깨진 경우. `onError` 로 받는다
 *
 * 대체 표시는 회색 빈 상자가 아니라 **주최사 이름이 든 색 블록**이다. 목록에서
 * 이미지 없는 카드가 여러 장 이어질 때 전부 같은 상자로 보이면 서로 구분이
 * 안 되므로, 이름으로 색을 정해 카드마다 다른 톤이 나오게 한다.
 *
 * 전체가 `aria-hidden` 이다 — 대체 표시는 이미지의 자리를 대신하는 장식이고,
 * 실제 이미지였다면 `alt=""` 였을 자리다. 제목·주최사는 카드 본문이 읽힌다 (15장).
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

/**
 * 색 조합은 토큰만 쓴다 (2.2). `--color-accent` 위에 흰 텍스트를 올리지 않는다는
 * 규칙 때문에 강조색 계열은 항상 짙은 글자와 짝짓는다.
 */
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
 * 이름으로 톤을 정한다. 순수 함수라 서버·클라이언트가 같은 답을 내고,
 * 같은 주최사의 소개팅은 목록 어디에서나 같은 색으로 보인다.
 */
function toneFor(label: string): string {
  let sum = 0;
  for (let i = 0; i < label.length; i += 1) sum += label.charCodeAt(i);
  return TONES[sum % TONES.length];
}
