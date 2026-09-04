import { currentTimeSlot, timeSlotLabel } from "@/entities/event";

/**
 * 헤드라인 + 추천 기준 문구 (5-4 / 5-5).
 *
 * 화면 전체가 밝고 **여기 한 곳만 짙다** — 이 위계가 디자인 시스템의 규칙이라
 * `bg-hero` 는 홈·온보딩 히어로에만 쓴다 (2.2).
 */
export function HomeHero({ baseAreaLabel }: { baseAreaLabel: string }) {
  return (
    <section className="rounded-card bg-hero px-5 py-6 text-surface">
      <h1 className="text-[20px] leading-[1.4] font-bold">
        오늘 갈 소개팅,
        <br />
        위치와 분위기로 골라요
      </h1>

      {/* 위치 + 현재 시각 기반 (5-5). 권한 거부 시 서버가 선호 지역명을 내려준다 */}
      <p className="mt-2 text-[13px] text-surface/85">
        {baseAreaLabel} 기준 · {timeSlotLabel(currentTimeSlot())} 소개팅을 추천했어요
      </p>
    </section>
  );
}
