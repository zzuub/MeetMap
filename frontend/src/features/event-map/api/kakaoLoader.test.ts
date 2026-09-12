import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createKakaoLoader, sdkUrl } from "./kakaoLoader";
import type { KakaoMapsShell } from "./kakaoTypes";

/**
 * 카카오맵 SDK 로드 (6.7 · `decisions.md` 4.71).
 *
 * 스크립트 · 전역 · 타이머를 전부 가짜로 둔다 — **jsdom 없이** 로드 판단(한 번만 · 재시도 ·
 * 시간 제한 · 실패 종류)을 잠근다 (4.10 · 4.61). 진짜 `<script>` 를 붙이는 몇 줄과 카카오의
 * 실제 응답은 브라우저에서 본다.
 */
interface FakeScript {
  src: string;
  load(): void;
  error(): void;
  removed: boolean;
}

/** 본체가 뜬 SDK 의 생성자 자리. 로더는 모양만 본다 */
const BODY = {
  LatLng: function LatLng() {},
  LatLngBounds: function LatLngBounds() {},
  Map: function Map() {},
  CustomOverlay: function CustomOverlay() {},
  event: {},
};

const TIMEOUT_MS = 1_000;

function setup({ appKey = "test-key" } = {}) {
  const scripts: FakeScript[] = [];
  let maps: KakaoMapsShell | undefined;
  let finishBody: (() => void) | null = null;

  const loader = createKakaoLoader({
    appKey,
    timeoutMs: TIMEOUT_MS,
    injectScript(src, on) {
      const script: FakeScript = { src, load: on.load, error: on.error, removed: false };
      scripts.push(script);
      return () => {
        script.removed = true;
      };
    },
    readMaps: () => maps,
  });

  return {
    loader,
    scripts,
    /** `sdk.js` 가 떴다 — 전역에는 `kakao.maps.load` 만 있다 */
    shellArrives() {
      maps = {
        load: (callback) => {
          finishBody = callback;
        },
      };
      scripts.at(-1)?.load();
    },
    /** `kakao.maps.load` 가 본체를 다 불렀다 */
    bodyArrives() {
      if (maps) Object.assign(maps, BODY);
      finishBody?.();
    },
    /** 본체 콜백은 왔는데 생성자가 없다 — SDK 모양이 바뀐 경우 */
    emptyBodyArrives() {
      finishBody?.();
    },
    /** 다른 화면이 이미 띄워 두었다 */
    alreadyLoaded() {
      maps = { load: () => {} };
      Object.assign(maps, BODY);
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("한 번만 붙인다", () => {
  it("본체까지 뜨면 SDK 를 준다 — `autoload=false` 로 부른다", async () => {
    const fake = setup();
    const loaded = fake.loader.load();

    expect(fake.scripts).toHaveLength(1);
    expect(fake.scripts[0].src).toBe(sdkUrl("test-key"));
    expect(fake.scripts[0].src).toContain("autoload=false");

    fake.shellArrives();
    fake.bodyArrives();

    await expect(loaded).resolves.toMatchObject({ Map: BODY.Map });
  });

  it("동시에 불러도 스크립트는 하나다", async () => {
    const fake = setup();
    const first = fake.loader.load();
    const second = fake.loader.load();

    expect(fake.scripts).toHaveLength(1);

    fake.shellArrives();
    fake.bodyArrives();

    expect(await first).toBe(await second);
  });

  it("한 번 뜬 뒤에는 다시 붙이지 않는다", async () => {
    const fake = setup();
    const first = fake.loader.load();
    fake.shellArrives();
    fake.bodyArrives();
    await first;

    await fake.loader.load();

    expect(fake.scripts).toHaveLength(1);
  });

  it("이미 떠 있으면 붙이지 않는다 — 다른 화면이 먼저 불렀다", async () => {
    const fake = setup();
    fake.alreadyLoaded();

    await expect(fake.loader.load()).resolves.toMatchObject({ Map: BODY.Map });
    expect(fake.scripts).toHaveLength(0);
  });
});

describe("실패 — 11.2 처럼 코드 · 시각 · 재시도 여부를 든다", () => {
  it("키가 없으면 스크립트를 붙이지 않는다 — 재시도해도 같다", async () => {
    const fake = setup({ appKey: "" });

    await expect(fake.loader.load()).rejects.toMatchObject({
      kind: "NO_KEY",
      code: "MAP_KEY_MISSING",
      retryable: false,
    });
    expect(fake.scripts).toHaveLength(0);
  });

  it("스크립트가 실패하면 떼고, 다음 호출이 다시 붙인다 — 그게 재시도다", async () => {
    const fake = setup();
    const failed = fake.loader.load();
    fake.scripts[0].error();

    await expect(failed).rejects.toMatchObject({
      kind: "SCRIPT",
      code: "MAP_SDK_LOAD",
      retryable: true,
    });
    expect(fake.scripts[0].removed).toBe(true);

    const retried = fake.loader.load();
    expect(fake.scripts).toHaveLength(2);

    fake.shellArrives();
    fake.bodyArrives();
    await expect(retried).resolves.toMatchObject({ Map: BODY.Map });
  });

  it("끝없이 기다리지 않는다 — 시간 제한에서 떼고 재시도할 수 있다", async () => {
    const fake = setup();
    let settled = false;
    const waiting = fake.loader.load();
    waiting.then(
      () => (settled = true),
      () => (settled = true),
    );

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS - 1);
    expect(settled).toBe(false);

    const assertion = expect(waiting).rejects.toMatchObject({
      kind: "TIMEOUT",
      code: "MAP_SDK_TIMEOUT",
      retryable: true,
    });
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(fake.scripts[0].removed).toBe(true);
  });

  it("시간 제한 뒤에 늦게 뜬 스크립트는 결과를 뒤집지 않는다", async () => {
    const fake = setup();
    const waiting = fake.loader.load();
    const assertion = expect(waiting).rejects.toMatchObject({ kind: "TIMEOUT" });

    await vi.advanceTimersByTimeAsync(TIMEOUT_MS);
    await assertion;

    // 이미 끝난 약속이다 — 늦은 이벤트가 두 번째 결과를 만들지도, 던지지도 않는다
    expect(() => {
      fake.shellArrives();
      fake.bodyArrives();
    }).not.toThrow();
  });

  it("스크립트는 떴는데 전역이 없다 — SDK 모양이 바뀌었다, 재시도해도 같다", async () => {
    const fake = setup();
    const loaded = fake.loader.load();
    fake.scripts[0].load();

    await expect(loaded).rejects.toMatchObject({
      kind: "SDK",
      code: "MAP_SDK_INIT",
      retryable: false,
    });
  });

  it("본체 콜백 뒤에도 생성자가 없으면 SDK 실패다", async () => {
    const fake = setup();
    const loaded = fake.loader.load();
    fake.shellArrives();
    fake.emptyBodyArrives();

    await expect(loaded).rejects.toMatchObject({ kind: "SDK" });
  });

  it("실패에는 발생 시각이 있다 — CS 식별자는 코드와 시각이다", async () => {
    const now = new Date("2026-09-11T10:00:00+09:00");
    vi.setSystemTime(now);

    await expect(setup({ appKey: "" }).loader.load()).rejects.toMatchObject({
      occurredAt: now,
    });
  });
});

describe("sdkUrl", () => {
  it("https 로 부르고 키는 인코딩해 싣는다", () => {
    expect(sdkUrl("a&b")).toBe(
      "https://dapi.kakao.com/v2/maps/sdk.js?appkey=a%26b&autoload=false",
    );
  });
});
