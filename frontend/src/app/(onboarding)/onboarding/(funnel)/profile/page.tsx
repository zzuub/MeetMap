import Link from "next/link";
import { ONBOARDING_STEPS } from "@/entities/account";
import { AppHeader } from "@/widgets/app-header";
import { ProfileForm } from "./_components/ProfileForm";

/**
 * 프로필 설정 `/onboarding/profile` (3.4 — P2-4).
 *
 * 우상단 `건너뛰기` 는 상시 노출이고 완료 단계로 점프한다 — `나중에 할래요`(3.3)와
 * 도착지가 같다. 저장하지 않고 넘어가므로 프로필이 없는 상태 그대로다.
 *
 * `AppHeader` 에 타이틀이 없으므로 이 화면이 자기 `h1` 을 갖는다 (4.34).
 */
export default function OnboardingProfilePage() {
  return (
    <>
      <AppHeader
        backHref={ONBOARDING_STEPS.intro}
        action={
          <Link
            href={ONBOARDING_STEPS.done}
            className="inline-flex min-h-11 items-center px-3 text-[13px] font-semibold text-text-sub"
          >
            건너뛰기
          </Link>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-6 px-5 pt-4 pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] leading-7 font-bold text-primary">
            어떤 소개팅을
            <br />
            먼저 보여드릴까요
          </h1>
          <p className="text-[13px] leading-5 text-text-sub">
            출생연도와 성별로 참가 조건에 맞는 회차만 골라드려요
          </p>
        </div>

        <ProfileForm />
      </main>
    </>
  );
}
