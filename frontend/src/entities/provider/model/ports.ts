import type { ProviderDetail, ProviderSummary } from "./types";

/**
 * 주최사 조회 계약 (port).
 *
 * `entities/event` 의 `EventApi` 와 같은 구조다 — 화면은 이 인터페이스만 알고,
 * 목/실 분기는 `api/providerApi.ts` 마지막 한 줄에서만 일어난다.
 *
 * ⚠️ **모집 중인 회차와 후기는 여기서 주지 않는다.** entity 끼리 서로를 모르므로
 * (FSD) 주최사 페이지(7.4)는 `providerApi.getDetail` + `eventApi.getList({
 * providerId, status: 'OPEN' })` + `reviewApi` 를 상위 레이어에서 조립한다.
 */
export interface ProviderApi {
  getDetail(id: string): Promise<ProviderDetail>;
  /** 카드·비교함처럼 요약만 필요한 자리 */
  getSummary(id: string): Promise<ProviderSummary>;
}
