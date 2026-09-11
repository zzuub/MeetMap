import { normalizeSearchKeyword } from "@/entities/event";

/**
 * 검색 입력 → 주소 커밋 (11.1 `debounce 300ms` · `decisions.md` 4.66).
 *
 * React 밖의 순수 객체로 뗐다 — 타이머와 판단을 **가짜 타이머로 jsdom 없이** 잠그려는
 * 것이다(4.10 · 4.61 목록에 셋째를 올리지 않은 이유). 화면(`SearchProvider`)은 입력
 * 이벤트를 여기로 넘기기만 한다.
 *
 * **`committed` 가 주소의 검색어다.** 이 화면에서 주소를 바꾸는 것은 이 객체뿐이고
 * `replace` 만 쓰므로 같은 화면 안에서 `popstate` 가 나지 않는다 — 서버 응답으로
 * 되맞추지 않는다. 느린 응답이 타이핑 중인 글자를 덮는 경로를 만들지 않는 것이다.
 */
export interface SearchControllerDeps {
  delayMs: number;
  /** 주소를 바꾼다(`router.replace`). `null` 이면 검색어 없는 `/search` */
  navigate(keyword: string | null): void;
  /** 최근 검색어에 남긴다 (4.69) */
  remember(keyword: string): void;
}

export interface SearchController {
  /** 입력이 바뀌었다 — 멈추면 커밋한다. 남기지 않는다 */
  type(raw: string): void;
  /** Enter — 지금 커밋하고 남긴다 */
  submit(raw: string): void;
  /** 최근 · 인기 · 추천 칩 — 지금 커밋하고 남긴다 */
  choose(keyword: string): void;
  /** ✕ · `다시 검색하기` — 검색어를 비우고 입력창으로 */
  clear(): void;
  /**
   * 입력창을 붙인다 — `clear` 가 포커스를 돌려줄 곳이다. 입력창이 **커밋될 때 스스로** 붙고
   * 떨어질 때 `null` 로 뗀다(콜백 ref). ref 객체를 받지 않는 것은 렌더 중에 ref 를 넘기는
   * 모양을 React 가 막기 때문이다(`react-hooks/refs`)
   */
  attachInput(focus: (() => void) | null): void;
  dispose(): void;
}

export function createSearchController(
  initial: string | null,
  deps: SearchControllerDeps,
): SearchController {
  let committed = initial;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let focusInput: (() => void) | null = null;

  function cancel() {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
  }

  /** 주소가 이미 그 검색어면 다시 가지 않는다 — 같은 조회가 한 번 더 돈다 */
  function commit(keyword: string | null) {
    cancel();
    if (keyword === committed) return;
    committed = keyword;
    deps.navigate(keyword);
  }

  return {
    type(raw) {
      cancel();
      const keyword = normalizeSearchKeyword(raw);
      if (keyword === committed) return;
      // 음절을 조합하는 중이다 — `성ㅅ` 을 커밋하면 `'성ㅅ' 검색 결과가 없어요` 가 깜빡인다
      if (keyword !== null && endsWithLoneJamo(keyword)) return;

      timer = setTimeout(() => commit(keyword), deps.delayMs);
    },
    submit(raw) {
      const keyword = normalizeSearchKeyword(raw);
      commit(keyword);
      if (keyword !== null) deps.remember(keyword);
    },
    choose(raw) {
      const keyword = normalizeSearchKeyword(raw);
      if (keyword === null) return;
      commit(keyword);
      deps.remember(keyword);
    },
    clear() {
      commit(null);
      focusInput?.();
    },
    attachInput(focus) {
      focusInput = focus;
    },
    dispose: cancel,
  };
}

/**
 * 끝 글자가 한글 낱자(자음·모음)인가 — IME 가 음절을 조합하는 중이라는 신호다.
 * 조합형 자모(U+1100–U+11FF)와 호환 자모(U+3130–U+318F, `ㄱ`~`ㅣ`)를 둘 다 본다.
 */
export function endsWithLoneJamo(text: string): boolean {
  return /[ᄀ-ᇿ㄰-㆏]$/.test(text);
}
