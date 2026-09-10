import { describe, expect, it } from "vitest";
import { onboardingSummary } from "./labels";
import type { UserProfile } from "./types";

const profile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: "usr-1",
  nickname: "민지",
  birthYear: 1996,
  gender: "F",
  preferredAreas: [],
  profileImageUrl: null,
  completionRate: 100,
  ...overrides,
});

describe("온보딩 완료 요약 (3.5)", () => {
  it("프로필을 건너뛴 사용자에게는 재유도 문구를 준다", () => {
    // 3.3 `나중에 할래요` · 3.4 `건너뛰기` 로 들어온 경로다
    expect(onboardingSummary(null)).toBe(
      "언제든 마이페이지에서 관심사를 추가할 수 있어요",
    );
  });

  it("선호 지역을 고른 사용자에게는 지역과 출생연도를 함께 말한다", () => {
    const summary = onboardingSummary(
      profile({ preferredAreas: ["성수·건대", "홍대·연남"] }),
    );

    expect(summary).toBe("성수·건대 · 홍대·연남의 1996년생 소개팅을 먼저 보여드릴게요");
  });

  it("지역을 안 고른 프로필에서 `의` 가 떠 있지 않다", () => {
    const summary = onboardingSummary(profile({ preferredAreas: [] }));

    expect(summary).toBe("1996년생 소개팅을 먼저 보여드릴게요");
    expect(summary.startsWith("의")).toBe(false);
  });

  it("출생연도는 네 자리 그대로 쓴다", () => {
    // 카드 배지의 `96년생`(두 자리)과 다른 자리다 — 문장 안에서는 축약하지 않는다
    expect(onboardingSummary(profile({ birthYear: 2003 }))).toContain("2003년생");
  });
});
