import { ENDPOINTS, fetchClient } from "@/shared/api";
import { USE_MOCK } from "@/shared/config";
import type { SearchApi } from "../model/ports";
import type { TrendingSnapshot } from "../model/types";
import { mockSearchApi } from "./searchApi.mock";

/**
 * 실 API 구현과 목 구현의 분기 지점 (`decisions.md` 4.3).
 * 계약은 `model/ports.ts` 의 `SearchApi`. 분기는 이 파일 마지막 한 줄이다.
 */
const httpSearchApi: SearchApi = {
  getTrending: () => fetchClient<TrendingSnapshot>(ENDPOINTS.search.trending),
};

export const searchApi: SearchApi = USE_MOCK ? mockSearchApi : httpSearchApi;
