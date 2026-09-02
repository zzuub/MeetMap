import { ENDPOINTS, fetchClient } from "@/shared/api";
import { USE_MOCK } from "@/shared/config";
import type { ProviderApi } from "../model/ports";
import type { ProviderDetail, ProviderSummary } from "../model/types";
import { mockProviderApi } from "./providerApi.mock";

/**
 * 실 API 구현과 목 구현의 분기 지점.
 *
 * `eventApi` 와 같은 형태다 — 계약은 `model/ports.ts`, 분기는 이 파일 마지막 줄
 * 하나. 컴포넌트에 `if (USE_MOCK)` 을 쓰지 않는다.
 */
const httpProviderApi: ProviderApi = {
  getDetail: (id) => fetchClient<ProviderDetail>(ENDPOINTS.provider.detail(id)),

  // 요약 전용 엔드포인트를 따로 두지 않았다. 서버가 나누면 그때 갈아끼운다.
  getSummary: (id) => fetchClient<ProviderSummary>(ENDPOINTS.provider.detail(id)),
};

export const providerApi: ProviderApi = USE_MOCK ? mockProviderApi : httpProviderApi;
