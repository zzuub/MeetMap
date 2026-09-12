import { Numeric } from "@/shared/ui";

/**
 * `총 N개 소개팅` (6.2). **리스트와 지도가 같은 숫자다** — 지도의 마커는 조건의 전건이라
 * 뷰포트를 옮겨도 이 숫자가 흔들리지 않는다 (`decisions.md` 4.71).
 */
export function ResultCount({ count }: { count: number }) {
  return (
    <p className="text-[13px] text-text-sub">
      총 <Numeric className="font-bold text-text">{count}</Numeric>개 소개팅
    </p>
  );
}
