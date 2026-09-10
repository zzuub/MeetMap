import { MOCK_LATENCY_MS } from "@/shared/config";
import { nearestArea } from "../model/nearestArea";
import type { GeoApi } from "../model/ports";

/**
 * 목 모드의 역지오코딩 (P2-6).
 *
 * 좌표를 지역 마스터의 대표 좌표(`AREA_CENTERS`)와 견줘 가장 가까운 것을 고른다.
 * **행정동 데이터가 없으므로 `label` 은 지역 마스터 라벨 그대로**다 — 4.2 의
 * 예시(`서울 성동구 성수동`)만큼 자세하지 않지만, 없는 데이터를 지어내면 화면이
 * 실 API 로 바뀌는 순간 문구 길이가 달라져 레이아웃이 깨진다.
 *
 * 목은 마스터 밖을 돌려주지 않는다 — `nearestArea` 가 언제나 하나를 고른다.
 * 그래서 `area === null` 경로는 **실 API 에서만** 나온다.
 */
export const mockGeoApi: GeoApi = {
  async reverseGeocode(point) {
    await delay();

    const area = nearestArea(point);
    return { label: area, area };
  },
};

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
