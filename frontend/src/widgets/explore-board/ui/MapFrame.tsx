import type { ReactNode } from "react";

/**
 * 지도 뷰의 바깥 — 화면 높이를 채워 지도 상자가 **남은 세로를 가져가게** 한다.
 *
 * 6.6 의 `calc(100vh - 250px)` 는 상단 컨트롤 높이를 250px 로 가정한 값이라, 적용 필터 칩
 * 줄이 붙거나 시간대 칩이 두 줄이 되면 어긋난다. 그래서 빼는 값을 적지 않고 flex 로 남은
 * 자리를 준다. `92px` 는 `(main)/layout` 의 하단 여백이다(2.1 — 탭바 위로 띄운다). 아래
 * 여백을 따로 두지 않는 것은 그 92px 이 이미 탭바와의 간격이기 때문이다 (`decisions.md` 4.71).
 */
export const MAP_BOARD_CLASS = "flex min-h-[calc(100dvh-92px)] flex-col gap-3 px-5 pt-4";

/**
 * 지도 상자 (6.6). 스켈레톤과 실제 지도가 **같은 상자**를 쓴다 — 크기가 다르면 폴백에서
 * 지도로 넘어갈 때 튄다.
 *
 * ⚠️ **최소 높이가 6.6 의 420px 가 아니라 320px 다.** 375×667 에서 잰 상단 컨트롤은
 * **174 · 220 · 268px** 이다(구 하나 / 조건 없음 / 적용 필터 칩 줄). 420px 상자는 뒤의 두
 * 경우에서 41px · 89px 이 고정 탭바 밑으로 들어간다 — 우측 하단의 줌 버튼이 가려지는
 * 자리다. 320px 이면 셋 다 탭바 위에서 끝난다(여유 24 · 24 · 11px).
 *
 * 가장 큰 268px 에서는 상자가 320px 바닥에 닿아 **페이지가 13px 스크롤된다.** 지도는 온전히
 * 보이므로 그대로 둔다 — 칩이 두 줄이 되면 더 내려가고, 그때 스크롤은 내용이 많다는 뜻이다
 * (`decisions.md` 4.71 · `spec/14-open-items.md` 사양 갱신 대기).
 */
export function MapFrame({ children }: { children: ReactNode }) {
  return (
    <section
      aria-label="소개팅 지도"
      className="relative flex min-h-[320px] flex-1 flex-col items-center justify-center overflow-hidden rounded-sheet border border-border bg-surface"
    >
      {children}
    </section>
  );
}
