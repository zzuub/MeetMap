import { ENDPOINTS, fetchClient, isApiError } from "@/shared/api";
import { USE_MOCK } from "@/shared/config";
import type { AuthContext, ProfileInput, UserApi } from "../model/ports";
import type { TermsAgreement, UserProfile } from "../model/types";
import { mockUserApi } from "./userApi.mock";

/**
 * 실 API 구현과 목 구현의 분기 지점 (`decisions.md` 4.3).
 * 계약은 `model/ports.ts` 의 `UserApi`. 분기는 이 파일 마지막 한 줄이다.
 */
const httpUserApi: UserApi = {
  getMyProfile: async ({ accessToken }: AuthContext) => {
    try {
      return await fetchClient<UserProfile>(ENDPOINTS.user.profile, { accessToken });
    } catch (error) {
      // **프로필이 없는 것은 실패가 아니다** — 3.3·3.4 로 건너뛴 정상 상태다.
      // 그 밖의 실패는 그대로 올려보내 화면이 11.2 로 잡는다.
      if (isApiError(error) && error.kind === "NOT_FOUND") return null;
      throw error;
    }
  },

  saveTerms: (agreement: TermsAgreement, { accessToken }: AuthContext) =>
    fetchClient<void>(ENDPOINTS.user.terms, {
      method: "POST",
      body: agreement,
      accessToken,
    }),

  saveProfile: (input: ProfileInput, { accessToken }: AuthContext) =>
    fetchClient<UserProfile>(ENDPOINTS.user.profile, {
      method: "PUT",
      body: input,
      accessToken,
    }),

  // 선호 지역만 바꾼다 (4.3). `PUT profile` 이 아니라 `PATCH` 인 이유와 서버가
  // 지켜야 할 것 셋은 `ENDPOINTS.user.preferredAreas` 에 적어 뒀다.
  savePreferredAreas: (areas: string[], { accessToken }: AuthContext) =>
    fetchClient<void>(ENDPOINTS.user.preferredAreas, {
      method: "PATCH",
      body: { preferredAreas: areas },
      accessToken,
    }),
};

export const userApi: UserApi = USE_MOCK ? mockUserApi : httpUserApi;
