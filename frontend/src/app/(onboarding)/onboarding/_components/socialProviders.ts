import type { AuthProvider } from "@/entities/account";

/**
 * 소셜 로그인 3종 (3.1). **이메일·비밀번호 가입은 없다.**
 *
 * ⚠️ 브랜드 컬러는 **디자인 토큰 체계의 명시적 예외**다 (2.2 각주) — 카카오
 * 옐로우·네이버 그린은 각 사 가이드가 정한 값이라 토큰으로 갈아끼울 수 없다.
 * 색상 하드코딩이 허용되는 자리는 이 표 하나뿐이다.
 *
 * `AuthProvider` 에는 `LOCAL` 이 있지만 여기 없다 — 운영자 전용이고 소셜 가입
 * 경로로 만들 수 없다 (dev-plan 3.4 / `decisions.md` 4.5).
 */
export const SOCIAL_PROVIDERS = [
  {
    code: "KAKAO",
    label: "카카오로 시작하기",
    className: "bg-[#FEE500] text-[#191600]",
  },
  {
    code: "NAVER",
    label: "네이버로 시작하기",
    className: "bg-[#03C75A] text-white",
  },
  {
    code: "GOOGLE",
    label: "Google로 시작하기",
    className: "border border-border bg-surface text-text",
  },
] as const;

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number]["code"];

/**
 * 폼이 보낸 값이 소셜 3종 중 하나인지 확인한다.
 *
 * 액션은 `FormData` 를 받으므로 값을 신뢰할 수 없다. `LOCAL` 을 실어 보내도
 * 여기서 걸린다 — 권한 자체는 서버가 서명한 `state` 로만 정해지지만(4.5),
 * 프론트가 먼저 모양을 좁혀 둔다.
 */
export function isSocialProvider(value: unknown): value is SocialProvider & AuthProvider {
  return SOCIAL_PROVIDERS.some((provider) => provider.code === value);
}
