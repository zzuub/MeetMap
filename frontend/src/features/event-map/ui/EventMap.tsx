"use client";

import dynamic from "next/dynamic";
import { MapLoadingOverlay } from "./MapOverlays";

/**
 * 탐색 지도 (6.6 · 6.7 `클라이언트 전용 + next/dynamic(ssr: false)`).
 *
 * **브라우저에서만 그린다** — SDK 가 `window` 에 기대고, 서버에서 그릴 지도가 없다.
 * `ssr: false` 는 서버 컴포넌트에서 쓰면 빌드 에러라 이 클라이언트 파일이 따로 있다
 * (Next 문서 `lazy-loading`). 리스트 뷰는 이 청크를 받지 않는다.
 *
 * 청크를 기다리는 동안에도 같은 오버레이다 — 서버 대기 · 청크 대기 · SDK 대기가 한 상자에서
 * 이어진다 (11.3).
 */
export const EventMap = dynamic(
  () => import("./EventMapCanvas").then((mod) => mod.EventMapCanvas),
  { ssr: false, loading: () => <MapLoadingOverlay /> },
);
