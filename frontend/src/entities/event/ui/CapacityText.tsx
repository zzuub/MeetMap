import { Numeric } from "@/shared/ui";
import { capacityLabel } from "../model/labels";

interface CapacityTextProps {
  maleCapacity: number;
  femaleCapacity: number;
  className?: string;
}

/**
 * 모집 정원 `남 N · 여 N` (5.3 / 6.5 / 6.6 / 7.1).
 *
 * **성비 게이지(`FemaleRatioBar`)를 만들지 않는다.** 남녀 정원이 고정 동수라
 * 성비는 항상 50% 이고, 게이지는 매번 절반이 찬 그림만 그린다 (14장 주석).
 *
 * 타이포(크기·색)는 **부모가 정한다.** `cn()` 은 Tailwind 클래스 충돌을 해결하지
 * 않으므로 여기서 `text-[12px]` 같은 기본값을 박으면 오버라이드가 조용히 깨진다.
 */
export function CapacityText({
  maleCapacity,
  femaleCapacity,
  className,
}: CapacityTextProps) {
  return (
    // 스크린리더에는 세리프 조각으로 쪼개지 않은 한 줄을 읽힌다.
    <span className={className} aria-label={capacityLabel(maleCapacity, femaleCapacity)}>
      <span aria-hidden>
        남 <Numeric>{maleCapacity}</Numeric> · 여 <Numeric>{femaleCapacity}</Numeric>
      </span>
    </span>
  );
}
