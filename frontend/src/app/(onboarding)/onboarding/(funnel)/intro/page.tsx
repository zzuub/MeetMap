import Link from "next/link";
import { ONBOARDING_STEPS } from "@/entities/account";

/**
 * 인트로(가치 제안) `/onboarding/intro` (3.3 — P2-3).
 *
 * 두 갈래가 전부다. `1분 만에 설정하기` → 프로필, `나중에 할래요` → **프로필을
 * 건너뛰고 완료로**. 건너뛴 사용자는 프로필이 없으므로 완료 화면이 3.5 의 미선택
 * 문구로 떨어지고 홈·탐색에서는 `viewer` 가 `null` 이 된다 — 가격이 남·여 병기로
 * 나오고 자격 필터 축이 생기지 않는다 (`decisions.md` 4.44).
 *
 * 서버에 남길 것이 없어 둘 다 링크다. "건너뛰었다"는 상태를 따로 저장하지 않는다 —
 * **프로필이 없다는 사실이 곧 그 상태**이고, 값을 둘로 두면 어긋난다.
 */
const BENEFITS = [
  { icon: "📍", title: "내 지역의 오늘 소개팅", body: "홈 상단에서 바로 확인해요" },
  { icon: "🎯", title: "참가 조건에 맞는 소개팅만", body: "나이대에 맞는 회차만 걸러 봐요" },
  { icon: "🔔", title: "찜한 소개팅 마감 전 알림", body: "놓치기 전에 알려드려요" },
] as const;

export default function OnboardingIntroPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 px-5 pt-14 pb-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-[22px] leading-7 font-bold text-primary">
          1분만 투자하면
          <br />
          이렇게 달라져요
        </h1>
        <p className="text-[13px] leading-5 text-text-sub">
          설정은 나중에 마이페이지에서도 바꿀 수 있어요
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {BENEFITS.map((benefit) => (
          <li
            key={benefit.title}
            className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-4"
          >
            <span
              aria-hidden
              className="flex size-11 shrink-0 items-center justify-center rounded-card bg-accent-soft text-xl"
            >
              {benefit.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[14px] font-bold text-text">{benefit.title}</p>
              <p className="text-[12px] text-text-sub">{benefit.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-2">
        <Link
          href={ONBOARDING_STEPS.profile}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-button bg-accent px-5 text-[15px] font-bold text-text"
        >
          1분 만에 설정하기
        </Link>

        <Link
          href={ONBOARDING_STEPS.done}
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-button px-5 text-[14px] font-semibold text-text-sub"
        >
          나중에 할래요
        </Link>
      </div>
    </main>
  );
}
