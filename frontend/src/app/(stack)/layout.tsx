import type { ReactNode } from "react";

/**
 * 스택 화면 셸 — 뒤로가기 헤더, 하단 탭 없음 (2.1).
 *
 * `AppHeader` 를 여기서 고정하지 않는 이유: 화면마다 타이틀과 우측 액션이 다르고
 * (`공유`, `설정`, `편집`, `모두 읽음`), 소개팅 상세는 히어로 이미지 위에 헤더가
 * 겹쳐 뜬다. 각 페이지가 `AppHeader` 를 직접 렌더한다. 이 레이아웃은 폭·배경·
 * 하단 여백만 책임진다.
 *
 * 이 그룹에 속한 화면: `/events/[id]`, `/compare`, `/search`, `/my/**`, `/reviews/**`
 */
export default function StackLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-shell flex-col bg-bg">
      {children}
    </div>
  );
}
