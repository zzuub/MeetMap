"use client";

import { useActionState, useState, useTransition } from "react";
import type { GeoPoint } from "@/entities/geo";
import { MAX_PREFERRED_AREAS } from "@/shared/config";
import { clampSelection, useIsClient } from "@/shared/lib";
import { useToast, type ActionFailure } from "@/shared/ui";
import { deniedReasonFromCode } from "../model/copy";
import type {
  DeniedReason,
  LocationResolution,
  NearbySummary,
} from "../model/types";
import { LocationAsking } from "./LocationAsking";
import { LocationDenied } from "./LocationDenied";
import { LocationGranted } from "./LocationGranted";

/**
 * 위치 권한 3상태 (4장 — P2-6).
 *
 * ## 상태를 어디에 두나
 *
 * **URL 이 아니다.** 2.4 는 URL 을 탐색 필터의 원본으로 쓰라고 했고, 권한 상태는
 * 공유·북마크할 값이 아니다. **서버도 아니다** — 좌표를 저장하지 않기로 한 이상
 * (4.1 고정 문구) 되살릴 값이 없다. 그래서 이 컴포넌트의 `useState` 하나다
 * (`decisions.md` 4.55).
 *
 * 새로고침하면 `asking` 으로 돌아온다. 저장한 것이 없으니 그게 정확한 표현이다.
 *
 * ## 세 상태가 서로 오간다 — 개발 중에도 전부 눌러볼 수 있다
 *
 * `asking → denied`(4.1 `지역 직접 선택할게요`) · `granted → denied`(4.2 자리) ·
 * `denied → asking`(4.3 `위치 권한 다시 허용하기`). 그래서 브라우저 권한을
 * 되돌리지 않고도 세 화면에 도달한다. **개발 전용 스위치를 따로 만들지 않는다.**
 *
 * ## 훅은 전부 여기 있다
 *
 * 화면 셋은 props 만 받는 순수 컴포넌트다 — jsdom 없이 `renderToStaticMarkup` 으로
 * 문구를 검증하기 위해서다 (4.10 유지 · 4.39 와 같은 형태).
 */
export function LocationPermissionGate({
  initialAreas,
  resolve,
  saveAreas,
}: {
  /** 3.4 에서 이미 고른 선호 지역. `denied` 의 초기 선택이다 (`decisions.md` 4.53) */
  initialAreas: readonly string[];
  /** 좌표 → 요약. **서버 액션**이라 좌표가 클라이언트 URL 로 새지 않는다 */
  resolve: (point: GeoPoint) => Promise<LocationResolution>;
  saveAreas: (
    previous: ActionFailure | null,
    formData: FormData,
  ) => Promise<ActionFailure | null>;
}) {
  const { showToast } = useToast();
  const isClient = useIsClient();

  const [view, setView] = useState<View>({ kind: "asking" });
  const [failure, setFailure] = useState<ActionFailure | null>(null);
  const [resolving, startResolving] = useTransition();

  const [areas, setAreas] = useState<readonly string[]>(initialAreas);
  const [saveFailure, saveAction, saving] = useActionState(saveAreas, null);

  const deny = (reason: DeniedReason) => setView({ kind: "denied", reason });

  const allow = () => {
    setFailure(null);

    // 미지원·권한 거부·위치 실패는 **다른 경로**다. 첫째는 요청조차 못 한다
    if (!hasGeolocation()) return deny("UNSUPPORTED");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        startResolving(async () => {
          const result = await resolve({ lat: latitude, lng: longitude });
          if (result.ok) setView({ kind: "granted", summary: result.summary });
          else setFailure(result.failure);
        });
      },
      (error) => deny(deniedReasonFromCode(error.code)),
      GEOLOCATION_OPTIONS,
    );
  };

  const toggleArea = (area: string) => {
    const { next, exceeded } = clampSelection(areas, area, MAX_PREFERRED_AREAS);
    if (exceeded) {
      showToast(`최대 ${MAX_PREFERRED_AREAS}개까지 선택할 수 있어요`);
      return;
    }
    setAreas(next);
  };

  if (view.kind === "granted") {
    return (
      <LocationGranted summary={view.summary} onChooseArea={() => deny("PERMISSION")} />
    );
  }

  if (view.kind === "denied") {
    return (
      <LocationDenied
        reason={view.reason}
        areas={areas}
        pending={saving}
        failure={saveFailure}
        formAction={saveAction}
        onToggleArea={toggleArea}
        onRetry={() => {
          setView({ kind: "asking" });
          allow();
        }}
      />
    );
  }

  return (
    <LocationAsking
      // 서버 렌더에서는 지원한다고 보고 그린다. 하이드레이션 뒤 실제 값으로 바뀐다
      supported={!isClient || hasGeolocation()}
      pending={resolving}
      failure={failure}
      onAllow={allow}
      onChooseArea={() => deny("PERMISSION")}
    />
  );
}

type View =
  | { kind: "asking" }
  | { kind: "granted"; summary: NearbySummary }
  | { kind: "denied"; reason: DeniedReason };

/**
 * 타임아웃을 명시한다. 기본값은 무한이라, 실내처럼 측위가 안 되는 곳에서
 * **버튼이 영원히 `확인하는 중...`** 으로 남는다 — 그건 상태가 아니라 멈춤이다.
 * `maximumAge: 0` 은 캐시된 좌표를 받지 않겠다는 뜻이다.
 */
const GEOLOCATION_OPTIONS: PositionOptions = { timeout: 10_000, maximumAge: 0 };

/**
 * ⚠️ **`"geolocation" in navigator` 로는 부족하다.** 키는 있는데 값이 없는 환경이
 * 실제로 있고(개발 중 스텁을 걷어내며 재현했다), 그때 `in` 검사는 통과한 뒤
 * `getCurrentPosition` 호출이 `TypeError` 로 터진다 — 미지원 안내 대신 아무 일도
 * 안 일어난 화면이 된다. 부를 함수가 실제로 있는지 본다.
 */
function hasGeolocation(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.geolocation?.getCurrentPosition === "function"
  );
}
