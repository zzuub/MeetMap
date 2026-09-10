import { ENDPOINTS, fetchClient } from "@/shared/api";
import { USE_MOCK } from "@/shared/config";
import type { GeoApi } from "../model/ports";
import type { GeoPoint, ReverseGeocoded } from "../model/types";
import { mockGeoApi } from "./geoApi.mock";

/**
 * 실 API 구현과 목 구현의 분기 지점 (`decisions.md` 4.3).
 * 계약은 `model/ports.ts` 의 `GeoApi`. 분기는 이 파일 마지막 한 줄이다.
 */
const httpGeoApi: GeoApi = {
  reverseGeocode: ({ lat, lng }: GeoPoint) =>
    fetchClient<ReverseGeocoded>(ENDPOINTS.geo.reverse, { query: { lat, lng } }),
};

export const geoApi: GeoApi = USE_MOCK ? mockGeoApi : httpGeoApi;
