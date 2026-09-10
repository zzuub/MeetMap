/**
 * 서비스 소개 히어로 (3.1).
 *
 * 지도 일러스트 + 마커 2개는 **정적 표시**다 — 실제 회차를 물어오지 않는다.
 * 로그인 전 화면이라 조회 실패라는 표면을 만들 이유가 없고, 문구는 "이런 게 있다"를
 * 보여주는 예시다.
 *
 * 짙은 그라디언트는 2.2 가 히어로에만 허용한 유일한 예외 배경이다.
 */
const MARKERS = [
  { label: "19:30 와인 로테이션", position: "left-6 top-10" },
  { label: "22:30 심야 다트", position: "right-5 bottom-9" },
] as const;

export function LoginHero() {
  return (
    <div
      aria-hidden
      className="relative h-[220px] w-full overflow-hidden rounded-card bg-[linear-gradient(135deg,#0A2119,#2E4A34_55%,#96A377)]"
    >
      {/* 지도 격자. 일러스트라 의미가 없으므로 스크린리더에 읽히지 않는다 */}
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(#FFFFFF33_1px,transparent_1px),linear-gradient(90deg,#FFFFFF33_1px,transparent_1px)] [background-size:34px_34px]" />

      {MARKERS.map((marker) => (
        <span
          key={marker.label}
          className={`absolute ${marker.position} rounded-chip bg-surface px-3 py-1.5 text-[12px] font-semibold text-text shadow-lg`}
        >
          {marker.label}
        </span>
      ))}
    </div>
  );
}
