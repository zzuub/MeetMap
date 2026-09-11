"use client";

import type { Ref } from "react";
import { IconButton } from "@/shared/ui";
import { SEARCH_COPY } from "../model/copy";
import { useSearchScreen } from "./SearchProvider";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  inputRef?: Ref<HTMLInputElement>;
  autoFocus?: boolean;
}

/**
 * 헤더의 검색 입력 (11.1). **훅이 없는 순수 컴포넌트다** — 테스트가 함수로 불러 `<form>`
 * 의 `onSubmit` 을 가짜 이벤트로 부른다 (4.39 수법 · `decisions.md` 4.61 P2-9 표).
 *
 * `form role="search"` 라 모바일 키보드의 `검색` 키가 Enter 로 온다. ✕ 는 글자가 있을
 * 때만 그리고(11.1) 44px 는 `IconButton` 이 지킨다(15장). 브라우저가 `type="search"` 에
 * 붙이는 자체 지우기 버튼은 감춘다 — ✕ 가 둘이 된다.
 */
export function SearchField({
  value,
  onChange,
  onSubmit,
  onClear,
  inputRef,
  autoFocus = false,
}: SearchFieldProps) {
  return (
    <form
      role="search"
      onSubmit={(event) => {
        // 네이티브 제출(`GET /search?…`)로 페이지를 새로 불러오지 않는다 — 커밋은 컨트롤러가 한다
        event.preventDefault();
        onSubmit();
      }}
      className="flex h-11 min-w-0 flex-1 items-center rounded-button bg-accent-soft pl-3 focus-within:outline-2 focus-within:outline-accent"
    >
      <label className="flex h-full min-w-0 flex-1 items-center gap-2">
        <SearchIcon />
        <span className="sr-only">{SEARCH_COPY.inputLabel}</span>
        <input
          ref={inputRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={SEARCH_COPY.placeholder}
          className="h-full min-w-0 flex-1 bg-transparent pr-2 text-[14px] text-text outline-none placeholder:text-text-sub [&::-webkit-search-cancel-button]:appearance-none"
        />
      </label>

      {value !== "" ? (
        <IconButton label={SEARCH_COPY.clearInput} onClick={onClear}>
          <ClearIcon />
        </IconButton>
      ) : null}
    </form>
  );
}

/** 헤더에 꽂는 쪽. 상태는 `SearchProvider` 가 든다 */
export function SearchInput() {
  const { draft, change, submit, clear, inputRef, autoFocus } = useSearchScreen();

  return (
    <SearchField
      value={draft}
      onChange={change}
      onSubmit={submit}
      onClear={clear}
      inputRef={inputRef}
      autoFocus={autoFocus}
    />
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4 shrink-0 text-text-sub" aria-hidden>
      <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M13.5 13.5L18 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ClearIcon() {
  return (
    <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-text-sub text-surface">
      <svg viewBox="0 0 12 12" className="size-2.5" aria-hidden>
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </span>
  );
}
