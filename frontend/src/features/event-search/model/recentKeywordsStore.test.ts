import { describe, expect, it, vi } from "vitest";
import { RECENT_KEYWORDS_KEY } from "@/shared/config";
import { createRecentKeywordsStore, type KeywordStorage } from "./recentKeywordsStore";

/**
 * 최근 검색어 저장소 (`decisions.md` 4.69 · 4.66 표 11·14·22번).
 *
 * 가짜 `Storage` 를 넣는다 — 저장소를 여는 함수를 받게 한 이유다. 던지는 저장소(차단 ·
 * 용량 초과)도 여기서만 만들 수 있다. jsdom 이 필요 없다 (4.10).
 */
class MemoryStorage implements KeywordStorage {
  readonly data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}

function storeWith(storage: KeywordStorage) {
  return createRecentKeywordsStore(() => storage);
}

describe("최근 검색어 저장소", () => {
  it("서버 스냅샷은 `unknown` 이다 — 서버는 `localStorage` 를 모른다", () => {
    expect(storeWith(new MemoryStorage()).getServerSnapshot()).toEqual({ status: "unknown" });
  });

  it("아무것도 없으면 `ready` 빈 목록이다", () => {
    expect(storeWith(new MemoryStorage()).getSnapshot()).toEqual({ status: "ready", keywords: [] });
  });

  it("값이 그대로면 같은 참조를 돌려준다 — `useSyncExternalStore` 가 매번 다시 그리지 않게", () => {
    const store = storeWith(new MemoryStorage());

    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });

  it("남기면 저장하고 구독자에게 알린다", () => {
    const storage = new MemoryStorage();
    const store = storeWith(storage);
    const listener = vi.fn();
    store.subscribe(listener);

    store.remember("성수");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ status: "ready", keywords: ["성수"] });
    expect(storage.getItem(RECENT_KEYWORDS_KEY)).toBe('["성수"]');
  });

  it("개별 삭제는 그 검색어만, 전체 삭제는 저장소 키까지 지운다", () => {
    const storage = new MemoryStorage();
    const store = storeWith(storage);
    store.remember("강남");
    store.remember("성수");

    store.remove("강남");
    expect(store.getSnapshot()).toEqual({ status: "ready", keywords: ["성수"] });

    store.clear();
    expect(store.getSnapshot()).toEqual({ status: "ready", keywords: [] });
    expect(storage.data.has(RECENT_KEYWORDS_KEY)).toBe(false);
  });

  it("구독을 풀면 더 알리지 않는다", () => {
    const store = storeWith(new MemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.remember("성수");

    expect(listener).not.toHaveBeenCalled();
  });

  it("읽기가 던지면 `unavailable` 이다 — 기록이 없다고 말하지 않는다", () => {
    const store = createRecentKeywordsStore(() => {
      throw new DOMException("site data blocked", "SecurityError");
    });

    expect(store.getSnapshot()).toEqual({ status: "unavailable" });
    // 막힌 저장소에 남기려 해도 던지지 않는다 — 검색은 계속된다
    expect(() => store.remember("성수")).not.toThrow();
  });

  it("쓰기만 던지면 그때부터 `unavailable` 이다 — 저장한 척하는 섹션을 남기지 않는다", () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new DOMException("quota", "QuotaExceededError");
    };
    const store = storeWith(storage);
    const listener = vi.fn();
    store.subscribe(listener);

    // 읽기는 된다 — 구형 사파리 사생활 보호가 이 모양이다
    expect(store.getSnapshot()).toEqual({ status: "ready", keywords: [] });

    store.remember("성수");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(store.getSnapshot()).toEqual({ status: "unavailable" });
  });

  it("다른 코드가 넣은 이상한 값도 던지지 않고 읽는다", () => {
    const storage = new MemoryStorage();
    storage.setItem(RECENT_KEYWORDS_KEY, "{망가진");

    expect(storeWith(storage).getSnapshot()).toEqual({ status: "ready", keywords: [] });
  });
});
