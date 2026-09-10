import type { TermsAgreement, UserProfile } from "./types";

/**
 * 내 계정 정보 계약 (port). 형태는 `EventApi`·`AccountApi` 와 같다 —
 * 계약은 `model/`, 구현은 `api/`, 분기는 `api/userApi.ts` 마지막 한 줄 (4.3).
 *
 * ⚠️ **액세스 토큰을 인자로 받는다.** `entities/user` 는 같은 레이어인
 * `entities/account` 를 임포트할 수 없어서(FSD) 쿠키 이름을 알 방법이 없다.
 * 토큰을 꺼내는 것은 앱 레이어의 `getAccessToken()` 이다.
 */
export interface AuthContext {
  /** 목 모드에서는 항상 `null` 이다 */
  accessToken: string | null;
}

/** 프로필 입력값 (3.4). 서버가 채우는 `id`·`completionRate` 는 받지 않는다. */
export interface ProfileInput {
  nickname: string;
  birthYear: number;
  gender: UserProfile["gender"];
  preferredAreas: string[];
}

export interface UserApi {
  /**
   * 내 프로필. **아직 만들지 않았으면 `null`** 이다 (3.3 `나중에 할래요` · 3.4 `건너뛰기`).
   *
   * 이 값이 화면의 `viewer` 다 — 가격 기준 성별과 자격 판정 출생연도가 여기서 온다
   * (`decisions.md` 4.44).
   */
  getMyProfile(auth: AuthContext): Promise<UserProfile | null>;

  /** 약관 동의 (3.2). 선택 항목(마케팅)은 알림 설정과 연동된다 (10.3) */
  saveTerms(agreement: TermsAgreement, auth: AuthContext): Promise<void>;

  /** 프로필 설정 (3.4) */
  saveProfile(input: ProfileInput, auth: AuthContext): Promise<UserProfile>;
}
