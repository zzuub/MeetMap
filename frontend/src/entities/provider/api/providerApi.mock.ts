import { ApiError } from "@/shared/api";
import { MOCK_LATENCY_MS } from "@/shared/config";
import { MOCK_PROVIDER_BY_ID } from "../mock/providers";
import type { ProviderApi } from "../model/ports";

/**
 * 목 구현. `entities/event` 의 `eventApi.mock` 과 같은 규칙을 따른다 —
 * 인위적 지연을 넣고, 없는 id 는 실제 404 와 같은 형태로 던진다.
 */
export const mockProviderApi: ProviderApi = {
  async getDetail(id) {
    await delay();

    const found = MOCK_PROVIDER_BY_ID[id];
    if (!found) {
      throw new ApiError({
        kind: "NOT_FOUND",
        code: "NOTFOUND_404",
        status: 404,
        message: "요청한 주최사를 찾을 수 없습니다.",
      });
    }
    return found;
  },

  async getSummary(id) {
    // 목에서는 상세와 같은 레코드를 준다. 실서버는 더 가벼운 응답을 내려도 된다.
    return this.getDetail(id);
  },
};

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}
