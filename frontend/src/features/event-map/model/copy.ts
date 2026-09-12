import type { LocationPrecision } from "@/entities/event";
import type { MapLoadFailureKind } from "../api/kakaoLoader";
import type { ZoomDirection } from "./viewport";

/**
 * 범례 (6.6 위치 정밀도). 모양이 무엇을 뜻하는지 말하지 않으면 정밀도를 나눈 뜻이 없다 —
 * 구 중심 핀을 정확한 주소로 읽고 헛걸음한다.
 */
export const PRECISION_LEGEND: Record<LocationPrecision, string> = {
  EXACT: "정확한 주소",
  STATION: "지하철역 기준",
  DISTRICT: "구 중심",
};

/**
 * 지도를 못 띄웠을 때 (11.2 형태). 네트워크 문구 하나를 넷 다에 쓰면 키가 없는 머신에서
 * 와이파이를 확인하게 된다 — `ERROR_COPY` 가 8종을 셋으로 나눈 것과 같은 이유다.
 */
export const MAP_FAILURE_COPY: Record<
  MapLoadFailureKind,
  { title: string; description: string }
> = {
  NO_KEY: {
    title: "지도를 쓸 수 없는 환경이에요",
    description: "리스트에서 같은 소개팅을 모두 볼 수 있어요",
  },
  SCRIPT: {
    title: "지도를 불러오지 못했어요",
    description: "네트워크 상태를 확인한 뒤 다시 시도해주세요",
  },
  TIMEOUT: {
    title: "지도가 늦어지고 있어요",
    description: "잠시 후 다시 시도해주세요",
  },
  SDK: {
    title: "지도를 불러오지 못했어요",
    description: "잠시 후 다시 들어와 주세요. 문제가 계속되면 아래 코드로 문의해주세요",
  },
};

/**
 * 줌 버튼의 이름 — **한계에서는 이름이 사유다** (2.5 `라벨이 미충족 사유를 안내`).
 * 아이콘 버튼이라 보이는 라벨이 없고, 스크린리더가 읽는 이름이 곧 라벨이다.
 */
export const ZOOM_LABEL: Record<ZoomDirection, { enabled: string; limit: string }> = {
  in: { enabled: "지도 확대", limit: "더 확대할 수 없어요" },
  out: { enabled: "지도 축소", limit: "더 축소할 수 없어요" },
};
