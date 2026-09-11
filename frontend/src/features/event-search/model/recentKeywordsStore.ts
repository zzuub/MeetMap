import { RECENT_KEYWORDS_KEY } from "@/shared/config";
import {
  parseStoredKeywords,
  withRecentKeyword,
  withoutRecentKeyword,
} from "./recentKeywords";

/**
 * 최근 검색어 저장소 (`localStorage` — 2.4 · `decisions.md` 4.69).
 *
 * `useSyncExternalStore` 에 그대로 꽂히는 모양이다. **스냅샷이 셋인 것이 요점이다** —
 * 서버는 `localStorage` 를 못 읽으므로 서버 렌더와 하이드레이션 첫 패스는 `unknown` 이고,
 * 그때 화면은 `기록이 없습니다` 라고 말하지 않는다(`useIsClient` 와 같은 장치).
 *
 * 저장소를 **여는 함수로 받는** 것은 테스트 때문이다 — 가짜 `Storage`(던지는 것 포함)를
 * 넣어 jsdom 없이 잠근다 (4.10).
 */
export type RecentKeywordsSnapshot =
  | { status: "unknown" }
  | { status: "unavailable" }
  | { status: "ready"; keywords: readonly string[] };

export type KeywordStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface RecentKeywordsStore {
  subscribe(listener: () => void): () => void;
  getSnapshot(): RecentKeywordsSnapshot;
  getServerSnapshot(): RecentKeywordsSnapshot;
  remember(keyword: string): void;
  remove(keyword: string): void;
  clear(): void;
}

const UNKNOWN: RecentKeywordsSnapshot = { status: "unknown" };
const UNAVAILABLE: RecentKeywordsSnapshot = { status: "unavailable" };

export function createRecentKeywordsStore(open: () => KeywordStorage): RecentKeywordsStore {
  const listeners = new Set<() => void>();
  /** `useSyncExternalStore` 는 값이 같으면 **같은 참조**를 요구한다 — 원문 문자열로 캐시한다 */
  let cache: { raw: string | null; snapshot: RecentKeywordsSnapshot } | null = null;
  /** 쓰기가 한 번이라도 던지면 이 세션 동안 저장할 수 없는 것으로 본다 */
  let writable = true;

  function getSnapshot(): RecentKeywordsSnapshot {
    if (!writable) return UNAVAILABLE;

    let raw: string | null;
    try {
      raw = open().getItem(RECENT_KEYWORDS_KEY);
    } catch {
      // 사이트 데이터 차단 — `localStorage` 에 접근만 해도 `SecurityError` 가 난다
      return UNAVAILABLE;
    }

    if (cache === null || cache.raw !== raw) {
      cache = { raw, snapshot: { status: "ready", keywords: parseStoredKeywords(raw) } };
    }
    return cache.snapshot;
  }

  function write(next: readonly string[]) {
    try {
      const storage = open();
      if (next.length === 0) storage.removeItem(RECENT_KEYWORDS_KEY);
      else storage.setItem(RECENT_KEYWORDS_KEY, JSON.stringify(next));
    } catch {
      // 용량 초과 · 구형 사파리 사생활 보호 — 읽기는 되는데 쓰기만 던진다. 저장한 척하는
      // 섹션을 남기지 않는다 (4.69)
      writable = false;
    }
    listeners.forEach((listener) => listener());
  }

  function update(change: (keywords: readonly string[]) => readonly string[]) {
    const snapshot = getSnapshot();
    if (snapshot.status !== "ready") return;
    write(change(snapshot.keywords));
  }

  return {
    subscribe(listener) {
      listeners.add(listener);

      // 다른 탭이 바꾼 것도 받는다. `storage` 이벤트는 **바꾼 탭에는 오지 않으므로** 같은
      // 탭의 변경은 위 `listeners` 가 알린다
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === RECENT_KEYWORDS_KEY) listener();
      };
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot,
    getServerSnapshot: () => UNKNOWN,
    remember: (keyword) => update((keywords) => withRecentKeyword(keywords, keyword)),
    remove: (keyword) => update((keywords) => withoutRecentKeyword(keywords, keyword)),
    clear: () => update(() => []),
  };
}

/**
 * 앱이 쓰는 저장소 하나. **여는 것은 부를 때다** — 서버가 이 모듈을 불러도 `window` 를
 * 건드리지 않는다(서버에서는 `getServerSnapshot` 만 불린다).
 */
export const recentKeywordsStore = createRecentKeywordsStore(() => window.localStorage);
