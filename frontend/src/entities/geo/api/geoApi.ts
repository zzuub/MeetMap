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
  /**
   * ⚠️ **조회인데 `POST` 다.** 좌표를 쿼리스트링에 실으면 프론트가 통제할 수 없는
   * 자리마다 평문으로 남는다 — 게이트웨이·프록시·APM 의 접근 로그는 기본이
   * `?lat=…&lng=…` 를 그대로 적는 것이다. 4.1 이 `저장되지 않습니다` 를 고정 문구로
   * 못 박은 이상, **백엔드의 로깅 설정에 기대는 계약을 만들지 않는다**
   * (`decisions.md` 4.54). 본문으로 보내면 그 자리들이 애초에 안 생긴다.
   *
   * 잃는 것은 HTTP 캐시인데, 이 응답은 **캐시되면 안 되는 값**이라 잃을 것이 없다.
   */
  reverseGeocode: (point: GeoPoint) =>
    fetchClient<ReverseGeocoded>(ENDPOINTS.geo.reverse, {
      method: "POST",
      body: point,
    }),
};

export const geoApi: GeoApi = USE_MOCK ? mockGeoApi : httpGeoApi;
