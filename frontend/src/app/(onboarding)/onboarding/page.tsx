import { ActionLink } from "@/shared/ui";
import { PhasePlaceholder } from "../../_components/PhasePlaceholder";

/**
 * 소셜 로그인 자리표시자 (3.1 — P2-1).
 *
 * ⚠️ **여기에만 나갈 길을 붙인다.** `(onboarding)` 셸에는 하단 탭도 헤더도 없어서
 * 자리표시자 중 **유일하게 갇히는 자리**다. 그리고 실제로 도달한다 — 게스트가
 * 하단 탭의 `찜`·`마이` 를 누르면 `checkAccess` 가 여기로 보낸다.
 * `/likes`·`/my` 자리표시자는 `(main)` 이라 탭이 출구다 (`decisions.md` 4.42).
 */
export default function OnboardingLoginPage() {
  return (
    <PhasePlaceholder
      title="소셜 로그인"
      phase="Phase 2 · P2-1"
      spec="3.1"
      action={<ActionLink href="/">홈으로 가기</ActionLink>}
    />
  );
}
