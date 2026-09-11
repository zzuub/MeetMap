"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
  type RefCallback,
} from "react";
import { SEARCH_DEBOUNCE_MS } from "@/shared/config";
import { recentKeywordsStore } from "../model/recentKeywordsStore";
import { createSearchController } from "../model/searchController";
import { SEARCH_QUERY_KEY, keywordFrom, searchHref } from "../model/searchParams";

interface SearchScreen {
  /** 입력창의 글자. 멈추기 전까지는 주소(원본)와 다를 수 있다 */
  draft: string;
  /** 커밋한 주소의 응답을 기다리는 중 */
  pending: boolean;
  /** 입력창에 꽂는 콜백 ref — 커밋될 때 컨트롤러에 스스로 붙는다 */
  inputRef: RefCallback<HTMLInputElement>;
  /** 검색어 없이 들어왔을 때만 입력창에 포커스한다 — 결과를 보러 온 사람의 키보드는 열지 않는다 */
  autoFocus: boolean;
  change: (value: string) => void;
  submit: () => void;
  clear: () => void;
  choose: (keyword: string) => void;
}

const SearchContext = createContext<SearchScreen | null>(null);

/**
 * 검색 화면의 **입력 상태와 주소 커밋** (11.1 · `decisions.md` 4.66).
 *
 * `search/layout.tsx` 가 둘러서 헤더의 입력창과 본문의 칩들이 같은 상태를 본다.
 * 레이아웃이라 검색어가 바뀌어도 다시 마운트되지 않는다 — 타이핑 중인 글자와 포커스가
 * 남는다.
 *
 * ⚠️ **주소는 마운트 때 한 번만 읽는다.** 그 뒤로 이 화면의 주소를 바꾸는 것은 여기뿐이고
 * `replace` 만 쓰므로 같은 화면 안의 `popstate` 가 없다. 서버 응답으로 입력창을 되맞추지
 * 않는다 — 느린 응답이 타이핑 중인 글자를 덮는다. `push` 를 들이면 이 전제가 깨진다.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [initial] = useState(() => keywordFrom(params.get(SEARCH_QUERY_KEY)));
  const [draft, setDraft] = useState(initial ?? "");
  const [controller] = useState(() =>
    createSearchController(initial, {
      delayMs: SEARCH_DEBOUNCE_MS,
      navigate: (keyword) => startTransition(() => router.replace(searchHref(keyword))),
      remember: recentKeywordsStore.remember,
    }),
  );

  // 입력창이 커밋될 때 스스로 붙는다 — 렌더 중에 ref 를 컨트롤러에 넘기지 않는다
  const inputRef = useCallback<RefCallback<HTMLInputElement>>(
    (element) => controller.attachInput(element ? () => element.focus() : null),
    [controller],
  );

  // 화면을 떠날 때 걸려 있던 커밋을 버린다 — 다른 화면에서 `/search` 로 끌려오지 않게
  useEffect(() => () => controller.dispose(), [controller]);

  const value = useMemo<SearchScreen>(
    () => ({
      draft,
      pending,
      inputRef,
      autoFocus: initial === null,
      change: (next) => {
        setDraft(next);
        controller.type(next);
      },
      submit: () => controller.submit(draft),
      clear: () => {
        setDraft("");
        controller.clear();
      },
      choose: (keyword) => {
        setDraft(keyword);
        controller.choose(keyword);
      },
    }),
    [controller, draft, initial, inputRef, pending],
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearchScreen(): SearchScreen {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error("useSearchScreen 은 SearchProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
