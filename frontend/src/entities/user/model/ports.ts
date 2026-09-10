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

  /**
   * 프로필 설정 (3.4).
   *
   * ⚠️ **선호 지역을 통째로 덮어쓴다.** 3.4 가 그 필드를 직접 받으므로 그래야 하지만,
   * 4.3 의 위치 권한 화면도 **같은 필드**에 쓴다 (`savePreferredAreas` /
   * `decisions.md` 4.53). 그래서 **프로필 수정 화면(P4-4)이 현재 값을 프리필하지
   * 않고 제출하면 위치 권한 화면에서 고른 지역이 조용히 지워진다.**
   */
  saveProfile(input: ProfileInput, auth: AuthContext): Promise<UserProfile>;

  /**
   * **찜한 소개팅 id 집합** (9장 · 2.4 `likedIds`).
   *
   * ⚠️ **화면은 `EventSummary.isLiked` 를 읽지 않는다** — 찜 상태의 원본은 이 집합
   * 하나다 (`decisions.md` 4.59). 목 구현이 그 필드를 사용자별로 채울 수 없기
   * 때문이고(목록 조회는 클라이언트에서도 도는데 쿠키를 못 읽는다), 값을 둘로 두면
   * 어긋난다 (4.53 과 같은 판단).
   */
  getLikedIds(auth: AuthContext): Promise<string[]>;

  /**
   * 찜 토글 (7.2 / 9장). `liked` 가 원하는 **결과 상태**다.
   *
   * **토글이 아니라 원하는 상태를 넘기는** 이유는 낙관적 업데이트다 — 화면이 이미
   * 결과를 그린 뒤에 부르므로, 서버가 다시 뒤집으면 두 번 누른 것과 구분되지 않는다.
   */
  setLike(eventId: string, liked: boolean, auth: AuthContext): Promise<void>;

  /**
   * 선호 지역만 갱신 (4.3 활동 지역 선택).
   *
   * ⚠️ **`saveProfile` 로 대신할 수 없다.** 위치 권한 화면은 퍼널의 마지막이라
   * 3.3 `나중에 할래요` · 3.4 `건너뛰기` 로 **프로필이 아예 없는 사용자**도
   * 도달한다. `ProfileInput` 은 닉네임·성별을 요구하므로 그 사용자에게는 부를 수
   * 없고, 빈 값으로 채우면 `viewer` 가 근거 없이 살아난다 (`decisions.md` 4.44).
   *
   * 그래서 **좁은 쓰기**다. 저장되는 값은 3.4 의 선호 지역과 **같은 필드**이고,
   * 프로필이 없는 동안에도 값은 남는다 — 다음에 프로필을 채우면 그때 읽힌다
   * (`decisions.md` 4.53).
   */
  savePreferredAreas(areas: string[], auth: AuthContext): Promise<void>;
}
