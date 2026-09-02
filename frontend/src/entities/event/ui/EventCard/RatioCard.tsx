import { CapacityText } from "../CapacityText";
import { VerticalCardFrame } from "./FeatureCard";
import { CardPrice, EligibilityBadge } from "./parts";
import type { EventCardLayoutProps } from "./types";

/**
 * `ratio` — 홈 `내 나이대 소개팅`. 196px + 정원 표기 (5.3 섹션 B).
 *
 * 이름은 성비 게이지가 있던 시절의 잔재다(14.1 이 그렇게 부른다). 실제로 하는 일은
 * **자격 배지 + 정원 표기**이지 성비 표시가 아니다 — 남녀 정원이 고정 동수라
 * 성비는 항상 50% 다.
 */
export function RatioCard({ event, viewer, action, href, className }: EventCardLayoutProps) {
  return (
    <VerticalCardFrame
      event={event}
      action={action}
      className={className}
      badges={<EligibilityBadge event={event} viewer={viewer} />}
      href={href}
      belowDate={
        <CapacityText
          maleCapacity={event.maleCapacity}
          femaleCapacity={event.femaleCapacity}
          className="text-[12px] text-text-sub"
        />
      }
      price={<CardPrice event={event} viewer={viewer} className="text-[13px]" />}
    />
  );
}
