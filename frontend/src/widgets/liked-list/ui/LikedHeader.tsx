/**
 * 찜 목록 헤더 (9장 `내 찜 목록`). 탭 화면이라 뒤로가기가 없다 — `AppHeader` 는 스택용이다.
 * 높이·배경은 2.1 의 공통 값이다.
 *
 * ⚠️ **액션 `편집`(일괄 삭제)은 그리지 않았다.** 동작이 9장에서 TBD 라 누르면 아무 일도
 * 없는 컨트롤이 된다 (4.29 · `decisions.md` 4.65).
 */
export function LikedHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-[var(--height-header)] items-center border-b border-border bg-surface/85 px-5 backdrop-blur-[10px]">
      <h1 className="text-[18px] font-bold text-primary">내 찜 목록</h1>
    </header>
  );
}
