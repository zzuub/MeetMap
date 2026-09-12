"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { EventSummary } from "@/entities/event";
import { loadKakaoMaps, mapLoadFailure, type MapLoadFailure } from "../api/kakaoLoader";
import { createMapController, type MapController } from "../model/mapController";
import { toMapMarker } from "../model/markers";
import type { ZoomDirection } from "../model/viewport";
import { MapLegend } from "./MapLegend";
import { MapMarker } from "./MapMarker";
import { MapFailure, MapLoadingOverlay } from "./MapOverlays";
import { ZoomControl } from "./ZoomControl";

export interface EventMapProps {
  /** 지도에 찍을 회차 — 현재 조건의 결과 **전건**이다 (6.6 `마커 소스`) */
  events: readonly EventSummary[];
  /** 지도를 못 쓸 때 가는 곳 — 같은 조건의 리스트. 주소는 위젯이 만든다(`exploreHref`) */
  listHref: string;
}

type SdkStatus =
  | { kind: "loading" }
  | { kind: "ready" }
  | { kind: "failed"; failure: MapLoadFailure };

/**
 * SDK 지도 + 마커 + 범례 + 줌 (6.6). `EventMap` 이 브라우저에서만 불러온다.
 *
 * 이 컴포넌트는 **잇기만 한다** — 로드 판단은 `createKakaoLoader`, 범위·줌 판단은
 * `createMapController`, 그리는 것은 훅 없는 조각들이 맡고 각자 테스트가 있다. 여기 남은
 * 연결(효과 · 포털 · 크기 감시)은 키가 있는 브라우저로 확인한다 (`decisions.md` 4.71).
 */
export function EventMapCanvas({ events, listHref }: EventMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<MapController | null>(null);
  const [status, setStatus] = useState<SdkStatus>({ kind: "loading" });
  const [level, setLevel] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  // 마커 안은 React 가 그린다(링크·포커스·접근 이름). SDK 에는 빈 상자만 넘긴다
  const pins = useMemo(
    () =>
      events.map((event) => ({
        marker: toMapMarker(event),
        element: document.createElement("div"),
      })),
    [events],
  );

  useEffect(() => {
    let disposed = false;
    let controller: MapController | null = null;

    loadKakaoMaps().then(
      (maps) => {
        const container = containerRef.current;
        if (disposed || container === null) return;

        try {
          controller = createMapController(maps, container, { onLevelChange: setLevel });
          controllerRef.current = controller;
          setStatus({ kind: "ready" });
        } catch (error) {
          // 좁게 적은 SDK 타입이 실물과 어긋나면 여기서 터진다 — 끝없는 로딩 대신 코드를 남긴다
          console.warn("[map] SDK 지도 생성 실패", error);
          setStatus({ kind: "failed", failure: mapLoadFailure("SDK") });
        }
      },
      (failure: MapLoadFailure) => {
        if (!disposed) setStatus({ kind: "failed", failure });
      },
    );

    return () => {
      disposed = true;
      controller?.dispose();
      controllerRef.current = null;
    };
  }, [attempt]);

  useEffect(() => {
    if (status.kind !== "ready") return;
    controllerRef.current?.showPins(
      pins.map(({ marker, element }) => ({
        id: marker.id,
        lat: marker.lat,
        lng: marker.lng,
        element,
      })),
    );
  }, [status, pins]);

  useEffect(() => {
    const container = containerRef.current;
    if (status.kind !== "ready" || container === null) return;

    // 칩 줄이 붙거나 화면이 돌면 상자 높이가 바뀐다 — SDK 는 스스로 다시 재지 않는다
    const observer = new ResizeObserver(() => controllerRef.current?.relayout());
    observer.observe(container);
    return () => observer.disconnect();
  }, [status]);

  function retry() {
    setStatus({ kind: "loading" });
    setAttempt((count) => count + 1);
  }

  function zoom(direction: ZoomDirection) {
    controllerRef.current?.zoom(direction);
  }

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="size-full" />

      {status.kind === "ready" ? (
        <>
          {pins.map(({ marker, element }) =>
            createPortal(<MapMarker marker={marker} />, element, marker.id),
          )}
          <MapLegend />
          <ZoomControl level={level} onZoom={zoom} />
        </>
      ) : null}

      {status.kind === "loading" ? <MapLoadingOverlay /> : null}

      {status.kind === "failed" ? (
        <MapFailure failure={status.failure} onRetry={retry} listHref={listHref} />
      ) : null}
    </div>
  );
}
