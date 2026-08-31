/**
 * 인증·역할 모델 (dev-plan 3장).
 *
 * 핵심 원칙: **소셜 로그인은 "신원"만 준다. "권한"은 우리 서버가 부여한다.**
 * 카카오·네이버·구글은 MeetMap의 USER/PROVIDER/ADMIN 개념을 모른다.
 */

export type Role = "USER" | "PROVIDER" | "ADMIN";

export type MembershipStatus =
  | "ACTIVE"
  | "PENDING" // PROVIDER 심사 대기
  | "REJECTED"
  | "SUSPENDED";

export type AuthProvider = "KAKAO" | "NAVER" | "GOOGLE" | "LOCAL";

/** 인증 주체. 소셜 신원과 1:1 대응한다. */
export interface Account {
  id: string;
  authProvider: AuthProvider;
  authProviderId: string;
  email: string | null;
}

/**
 * 역할 부여. Account 1:N Membership.
 *
 * 같은 사람이 개인 회원이면서 주최사 담당자일 수 있다. 계정에 `role` 컬럼 하나를
 * 박아두면 나중에 계정을 새로 파야 한다.
 * 단 **UI에서는 한 번에 하나의 역할만 활성**시킨다(역할 전환 메뉴).
 */
export interface Membership {
  accountId: string;
  role: Role;
  status: MembershipStatus;
  grantedAt: string;
}

/** 현재 세션. JWT 클레임에서 복원한다. */
export interface Session {
  accountId: string;
  role: Role;
  status: MembershipStatus;
  /** 온보딩(약관·프로필)을 아직 마치지 않은 신규 가입자 (3.1) */
  isNewUser: boolean;
  nickname: string | null;
}

/* ── 가입 의도 (dev-plan 3.3) ───────────────────────────── */

/**
 * OAuth `state` 에 실어 보내는 가입 의도.
 *
 * ⚠️ **`ADMIN` 은 의도적으로 빠져 있다.** 운영자 계정은 소셜 가입 경로로 만들 수 없고
 * 초대/시드로만 발급한다(dev-plan 3.4). 이 유니온에 ADMIN 을 추가하지 않는다.
 */
export type AuthIntent = "USER" | "PROVIDER";

export const AUTH_INTENTS: readonly AuthIntent[] = ["USER", "PROVIDER"];

/**
 * 클라이언트가 보낸 값이 허용된 가입 의도인지 확인한다.
 *
 * ⚠️ 이 함수는 **UX 가드일 뿐 보안 경계가 아니다.** 실제 의도는 서버가 서명한
 * `state` 로만 전달되어야 하고, 서버가 서명을 검증한다. 콜백 요청 바디의 `role`
 * 값을 그대로 믿으면 `role: "ADMIN"` 한 줄로 권한 상승이 된다.
 */
export function isAllowedAuthIntent(value: unknown): value is AuthIntent {
  return AUTH_INTENTS.includes(value as AuthIntent);
}
