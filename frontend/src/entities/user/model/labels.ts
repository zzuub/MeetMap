import type { UserProfile } from "./types";

/**
 * 온보딩 완료 요약 문구 (3.5).
 *
 * 세 갈래다. 3.5 는 둘만 적었지만 **`나중에 할래요`(3.3)와 `건너뛰기`(3.4)로 들어온
 * 사용자**가 셋째를 만든다 — 프로필은 있는데 선호 지역이 없는 경우다. 지역 없이
 * 문구를 조립하면 `의 1996년생...` 이 남는다.
 */
export function onboardingSummary(profile: UserProfile | null): string {
  if (!profile) {
    // 프로필 자체를 건너뛴 경로. 3.5 의 미선택 문구 그대로다
    return "언제든 마이페이지에서 관심사를 추가할 수 있어요";
  }

  const year = `${profile.birthYear}년생`;

  if (profile.preferredAreas.length === 0) {
    return `${year} 소개팅을 먼저 보여드릴게요`;
  }

  return `${profile.preferredAreas.join(" · ")}의 ${year} 소개팅을 먼저 보여드릴게요`;
}
