import { formatNumber, formatPrice } from "@/shared/lib";
import { Numeric } from "@/shared/ui";
import { PRICE_UNKNOWN_LABEL, priceDisplay } from "../model/labels";
import type { ViewerGender } from "../model/types";

interface PriceTextProps {
  malePrice: number | null;
  femalePrice: number | null;
  /**
   * 가격 기준이 되는 성별. **게스트는 `null`** 이고 남·여를 병기한다 —
   * 어느 쪽이 자기 값인지 알 수 없기 때문이다 (2.2 UI 원칙).
   */
  gender: ViewerGender | null;
  className?: string;
}

/**
 * 참가비 (5.3 / 6.5 / 6.6).
 *
 * 로그인 사용자에게는 **자기 성별 기준값만** 노출한다. 남·여 양쪽 표기는 상세(7.1)와
 * 외부 이동 모달(7.3)의 몫이다 — 거기서는 조건 고지가 목적이라 둘 다 필요하다.
 *
 * 가격 미확인 건은 `링크 확인` 으로 떨어진다. `0원`·`무료` 로 읽힐 여지가 있는
 * 문구를 쓰지 않는다. 가격 상한 필터도 같은 이유로 이 건을 제외한다.
 *
 * 타이포는 부모가 정한다(→ `CapacityText` 주석).
 */
export function PriceText({
  malePrice,
  femalePrice,
  gender,
  className,
}: PriceTextProps) {
  const display = priceDisplay({ malePrice, femalePrice }, gender);

  if (display.kind === "unknown") {
    // 세리프는 숫자의 규칙이다. 문구에는 쓰지 않는다.
    return <span className={className}>{PRICE_UNKNOWN_LABEL}</span>;
  }

  if (display.kind === "single") {
    return (
      <span className={className}>
        <Numeric>{formatPrice(display.amount)}</Numeric>
      </span>
    );
  }

  // 게스트 병기. 196px 카드에 들어가야 해서 '원' 은 뒤에 한 번만 붙인다.
  return (
    <span className={className}>
      남 <Numeric>{amountOrDash(display.male)}</Numeric> · 여{" "}
      <Numeric>{amountOrDash(display.female)}</Numeric>원
    </span>
  );
}

function amountOrDash(amount: number | null): string {
  return amount === null ? "-" : formatNumber(amount);
}
