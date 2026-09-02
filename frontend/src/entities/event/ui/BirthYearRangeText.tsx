import { birthYearRangeLabel } from "../model/labels";

interface BirthYearRangeTextProps {
  birthYearFrom: number;
  birthYearTo: number;
  className?: string;
}

/**
 * 참가 가능 출생연도 `90~96년생` (6.5 / 6.6 / 7.1 / 7.3).
 *
 * 나이가 아니라 **출생연도**다. 주최사 게시물이 그렇게 모집하고, 나이로 환산하면
 * 생일 전후로 답이 달라져 조건 확인 블록(7.3)에서 분쟁의 소지가 된다.
 *
 * 세리프(`Numeric`)를 쓰지 않는다 — 세리프는 가격·평점·카운터 숫자의 규칙이고
 * (2.2), 출생연도는 그 셋 중 어느 것도 아니다.
 */
export function BirthYearRangeText({
  birthYearFrom,
  birthYearTo,
  className,
}: BirthYearRangeTextProps) {
  return (
    <span className={className}>
      {birthYearRangeLabel(birthYearFrom, birthYearTo)}
    </span>
  );
}
