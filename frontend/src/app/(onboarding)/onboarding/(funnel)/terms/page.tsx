import { ONBOARDING_STEPS } from "@/entities/account";
import { AppHeader } from "@/widgets/app-header";
import { TermsForm } from "./_components/TermsForm";

/**
 * 약관 동의 `/onboarding/terms` (3.2 — P2-2).
 *
 * 뒤로가기(←)는 로그인 단계로 돌아간다 — 3.2 가 정한 동작이고, 여기가 **퍼널에서
 * 빠져나가는 유일한 문**이라 `backHref` 로 목적지를 못 박는다. `router.back()` 에
 * 맡기면 로그인 액션이 `redirect` 로 들어온 경우 히스토리가 한 칸 앞이 아니다.
 *
 * `AppHeader` 에 타이틀이 없으므로 이 화면이 자기 `h1` 을 갖는다 (4.34).
 */
export default function OnboardingTermsPage() {
  return (
    <>
      <AppHeader backHref={ONBOARDING_STEPS.login} />

      <main className="flex flex-1 flex-col gap-6 px-5 pt-4 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] leading-7 font-bold text-primary">
            서비스 이용을 위해
            <br />
            약관에 동의해주세요
          </h1>
          <p className="text-[13px] leading-5 text-text-sub">
            만 19세 이상만 이용할 수 있어요
          </p>
        </div>

        <TermsForm />
      </main>
    </>
  );
}
