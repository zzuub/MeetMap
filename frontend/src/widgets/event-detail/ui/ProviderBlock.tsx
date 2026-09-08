import {
  providerRatingDisplay,
  type EventProviderDetail,
  type RatingDisplay,
} from "@/entities/event";
import { Numeric } from "@/shared/ui";

/**
 * 주최사 블록 (7.1) — 주최사명 + 한 줄 소개 + 평점.
 *
 * ⚠️ **`소개 보기 >` 와 메타 줄의 주최사명 링크를 붙이지 않았다.** `/providers/[id]`
 * 는 P5-4 라 라우트가 없어 지금 누르면 404 다 — `decisions.md` 4.32. 미룬 것은
 * 이동 수단뿐이라 P5-4 가 링크만 얹으면 된다.
 */
export function ProviderBlock({ provider }: { provider: EventProviderDetail }) {
  return (
    <section className="rounded-card border border-border bg-surface px-4 py-3.5">
      <p className="text-[15px] font-bold text-text">{provider.name}</p>
      <p className="mt-1 text-[13px] leading-5 text-text-sub">{provider.tagline}</p>
      <p className="mt-2">
        <ProviderRating display={providerRatingDisplay(provider)} />
      </p>
    </section>
  );
}

/** `★ 4.6 (47)` / 표시 임계 미달이면 `후기 3건` (7.4). 건수 없는 평점은 쓰지 않는다 */
function ProviderRating({ display }: { display: RatingDisplay }) {
  if (display.kind === "countOnly") {
    return (
      <span className="text-[13px] text-text-sub">
        후기 <Numeric className="font-bold text-text">{display.reviewCount}</Numeric>건
      </span>
    );
  }

  return (
    <span
      className="text-[13px] text-text-sub"
      aria-label={`평점 ${display.rating.toFixed(1)}, 후기 ${display.reviewCount}건`}
    >
      {/* 별에 `--color-accent` 를 쓰지 않는다 — 흰 배경 위 대비 1.7:1 로 WCAG 미달이다
          (2.2). 색을 주지 않고 본문 색을 물려받는다 */}
      <span aria-hidden>
        ★ <Numeric className="font-bold text-text">{display.rating.toFixed(1)}</Numeric>{" "}
        (<Numeric>{display.reviewCount}</Numeric>)
      </span>
    </span>
  );
}
