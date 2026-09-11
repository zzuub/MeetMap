import { connection } from "next/server";
import type { ReactNode } from "react";
import {
  SEARCH_COPY,
  SearchInput,
  SearchPending,
  SearchProvider,
} from "@/features/event-search";
import { AppHeader } from "@/widgets/app-header";

/**
 * 검색 `/search` 의 셸 (11.1) — **헤더의 입력창은 여기 있다.**
 *
 * 페이지에 두면 `loading.tsx` 경계 안이라 첫 진입 동안 입력창이 없다. 레이아웃은 검색어가
 * 바뀌어도 다시 마운트되지 않으므로 타이핑 중인 글자와 포커스도 남는다 (`decisions.md` 4.66).
 * 검색어는 레이아웃이 `searchParams` 를 못 받아 `SearchProvider` 가 `useSearchParams` 로
 * 마운트 때 읽는다.
 */
export default async function SearchLayout({ children }: { children: ReactNode }) {
  /*
    ⚠️ **요청을 기다린 뒤에 그린다.** 빌드가 이 라우트를 프리렌더하려다 `SearchProvider` 의
    `useSearchParams` 에서 멈췄다(`missing-suspense-with-csr-bailout`) — 페이지가
    `searchParams` 를 읽어 동적이어도 **레이아웃의 클라이언트 훅이 먼저 걸린다.** Suspense 로
    감싸면 서버가 입력창 대신 폴백을 그리므로 동적으로 못 박는 쪽을 골랐다
    (Next 문서 `use-search-params` — Dynamic Rendering · `decisions.md` 4.66)
  */
  await connection();

  return (
    <SearchProvider>
      <AppHeader>
        <SearchInput />
      </AppHeader>
      {/* 제목 자리가 입력창이라 이 화면이 `h1` 을 갖는다 (4.34 · 4.70) */}
      <h1 className="sr-only">{SEARCH_COPY.heading}</h1>

      <SearchPending>{children}</SearchPending>
    </SearchProvider>
  );
}
