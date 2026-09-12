import { KAKAO_MAP_APP_KEY } from "@/shared/config";
import type { KakaoMapsApi, KakaoMapsShell } from "./kakaoTypes";

/**
 * 카카오맵 SDK 를 **한 번만** 불러온다 (6.7 · `decisions.md` 4.71).
 *
 * `next/script` 가 아니라 `<script>` 를 직접 붙인다 — 실패한 스크립트를 떼고 다시 붙이는
 * **재시도**와 끝없는 로딩을 끊는 **시간 제한**을 이쪽이 쥐어야 11.2 의 재시도 규칙을 지킨다.
 * 판단은 `createKakaoLoader` 에 떼어 가짜 스크립트·가짜 타이머로 잠근다 (4.10 · 4.61).
 *
 * ⚠️ **재시도가 붙이는 것과 기다리는 것이 다르다.** 받기가 실패했으면 떼고 새로 붙이지만,
 * 시간 제한으로 끊었을 때는 **받던 것을 그대로 기다린다** — 내려받기는 취소되지 않으므로
 * 새로 붙이면 곧 도착할 것을 버리고 처음부터 받는다 (PR #48 리뷰 · `decisions.md` 4.71).
 */

export type MapLoadFailureKind = "NO_KEY" | "SCRIPT" | "TIMEOUT" | "SDK";

/** 지도를 못 띄운 이유 — 11.2 처럼 코드·발생 시각·재시도 여부를 들고 다닌다 */
export interface MapLoadFailure {
  kind: MapLoadFailureKind;
  code: string;
  occurredAt: Date;
  retryable: boolean;
}

/**
 * ⚠️ **`SCRIPT` 는 두 원인을 못 가른다.** 키가 없거나 도메인이 등록되지 않은 요청에 카카오는
 * `401` + JSON 본문으로 답하고(2026-09-11 확인), 브라우저는 그것을 네트워크 실패와 **같은
 * `error` 이벤트**로 알린다. 재시도를 남기는 것은 사용자 쪽의 흔한 원인이 네트워크라서다.
 */
const FAILURES: Record<MapLoadFailureKind, { code: string; retryable: boolean }> = {
  NO_KEY: { code: "MAP_KEY_MISSING", retryable: false },
  SCRIPT: { code: "MAP_SDK_LOAD", retryable: true },
  TIMEOUT: { code: "MAP_SDK_TIMEOUT", retryable: true },
  SDK: { code: "MAP_SDK_INIT", retryable: false },
};

export function mapLoadFailure(kind: MapLoadFailureKind): MapLoadFailure {
  return { kind, ...FAILURES[kind], occurredAt: new Date() };
}

export interface KakaoLoaderDeps {
  appKey: string;
  timeoutMs: number;
  /** `<script>` 를 붙인다. 떼는 함수를 돌려준다 */
  injectScript(src: string, on: { load(): void; error(): void }): () => void;
  /** 스크립트가 심는 전역 `window.kakao.maps` */
  readMaps(): KakaoMapsShell | undefined;
}

export interface KakaoLoader {
  load(): Promise<KakaoMapsApi>;
}

export function createKakaoLoader(deps: KakaoLoaderDeps): KakaoLoader {
  let pending: Promise<KakaoMapsApi> | null = null;

  /**
   * 붙여 둔 스크립트가 본체까지 띄우는 약속 — **시간 제한과 무관하게 산다.**
   *
   * `script.remove()` 는 이미 시작된 내려받기를 취소하지 못한다. 그래서 시간 제한으로 끊을
   * 때는 떼지 않고 이것을 남겨 두고, 다음 호출이 **받던 것을 그대로 기다린다.** 떼고 다시
   * 붙이면 곧 도착할 것을 버리고 처음부터 받는다.
   */
  let ready: Promise<KakaoMapsApi> | null = null;

  function loadSdkOnce(): Promise<KakaoMapsApi> {
    if (ready) return ready;

    let removeScript = () => {};
    const started = new Promise<KakaoMapsApi>((resolve, reject) => {
      removeScript = deps.injectScript(sdkUrl(deps.appKey), {
        load() {
          const maps = deps.readMaps();
          if (!maps) {
            reject(mapLoadFailure("SDK"));
            return;
          }
          maps.load(() => (isReady(maps) ? resolve(maps) : reject(mapLoadFailure("SDK"))));
        },
        error: () => reject(mapLoadFailure("SCRIPT")),
      });
    });

    // **스크립트가 틀어진 경우만** 떼고 비운다 — 다음 호출이 새로 붙이는 것이 재시도다
    const guarded = started.catch((failure: unknown) => {
      removeScript();
      if (ready === guarded) ready = null;
      throw failure;
    });

    ready = guarded;
    return guarded;
  }

  function attempt(): Promise<KakaoMapsApi> {
    return new Promise((resolve, reject) => {
      if (!deps.appKey) {
        reject(mapLoadFailure("NO_KEY"));
        return;
      }

      // 다른 화면이 이미 띄워 두었다
      const present = deps.readMaps();
      if (present && isReady(present)) {
        resolve(present);
        return;
      }

      let settled = false;
      const settle = (done: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        done();
      };

      // 시간 제한은 **이 기다림만** 끊는다. 재시도는 제 타이머를 새로 갖는다
      const timer = setTimeout(() => settle(() => reject(mapLoadFailure("TIMEOUT"))), deps.timeoutMs);

      loadSdkOnce().then(
        (maps) => settle(() => resolve(maps)),
        // 끊긴 뒤에 오면 `settled` 가 삼킨다 — 발생 시각은 실패가 난 그때다
        (failure: unknown) => settle(() => reject(failure)),
      );
    });
  }

  return {
    load() {
      // 동시에 불러도 스크립트는 하나다. 실패하면 비워 다음 호출이 다시 시도한다
      pending ??= attempt().catch((failure: unknown) => {
        pending = null;
        throw failure;
      });
      return pending;
    },
  };
}

/** `autoload=false` — 스크립트가 뜬 뒤 `kakao.maps.load` 로 본체를 부른다. 시점을 우리가 쥔다 */
export function sdkUrl(appKey: string): string {
  return `${SDK_ORIGIN}/v2/maps/sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`;
}

const SDK_ORIGIN = "https://dapi.kakao.com";

function isReady(maps: KakaoMapsShell): maps is KakaoMapsApi {
  return (
    typeof maps.LatLng === "function" &&
    typeof maps.LatLngBounds === "function" &&
    typeof maps.Map === "function" &&
    typeof maps.CustomOverlay === "function" &&
    maps.event !== undefined
  );
}

/* ── 브라우저 ───────────────────────────────────────────── */

/**
 * SDK 를 기다리는 상한. **재지 않은 값이다** — 느린 회선에 맞춘 값이 아니라 끝없는 로딩을
 * 끊는 값이다. 걸리면 `MAP_SDK_TIMEOUT` 이고 다시 시도할 수 있다.
 */
const SDK_TIMEOUT_MS = 15_000;

let browserLoader: KakaoLoader | null = null;

/** 화면이 부르는 자리 — 브라우저에서만 부른다(서버 렌더에는 `document` 가 없다) */
export function loadKakaoMaps(): Promise<KakaoMapsApi> {
  browserLoader ??= createKakaoLoader({
    appKey: KAKAO_MAP_APP_KEY,
    timeoutMs: SDK_TIMEOUT_MS,
    injectScript: appendScript,
    readMaps: () => window.kakao?.maps,
  });

  return browserLoader.load().catch((failure: unknown) => {
    // 카드에는 코드만 남는다. 원인 후보는 개발자가 콘솔에서 본다
    console.warn(
      "[map] 카카오맵 SDK 를 띄우지 못했다 — 키(NEXT_PUBLIC_KAKAO_MAP_APP_KEY) · 네트워크 · " +
        "JavaScript SDK 도메인 등록 · 카카오맵 활성화 설정을 확인한다",
      failure,
    );
    throw failure;
  });
}

function appendScript(src: string, on: { load(): void; error(): void }): () => void {
  const script = document.createElement("script");
  script.src = src;
  script.async = true;
  script.addEventListener("load", on.load);
  script.addEventListener("error", on.error);
  document.head.appendChild(script);
  return () => script.remove();
}
