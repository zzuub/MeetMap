import Link from "next/link";
import { safeRedirect } from "@/entities/account";
import { LoginHero } from "./_components/LoginHero";
import { SocialSignIn } from "./_components/SocialSignIn";

/**
 * 소셜 로그인 `/onboarding` (3.1 — P2-1).
 *
 * **여기서 세션을 보고 리다이렉트하지 않는다.** `isNewUser` 판정은 로그인 액션
 * 한 곳(`signInLanding`)에서만 일어난다 — 화면이 먼저 판정해 튕겨내면 ① 퍼널 중간에
 * 뒤로가기로 돌아온 사용자가 리다이렉트에 갇히고 ② 이미 가입한 브라우저에서는
 * `기존 회원은 홈으로` 분기를 누를 방법이 사라진다 (`decisions.md` 4.45).
 *
 * ⚠️ **`약관 링크`(3.1 표 5행)를 그리지 않았다.** 목적지 화면이 TBD 다 —
 * `/policy/terms` 는 라우트가 없어 404 로 간다. 4.29·4.40 과 같은 기준이다.
 *
 * ⚠️ **인증 실패 토스트(3.1 예외 열)도 아직 없다.** 실 모드에서 실패가 드러나는
 * 자리는 소셜 인증 **콜백**이고 그건 백엔드 몫이다. 목 모드에는 실패 경로가 없어
 * 지금 만들면 눌러볼 수 없는 코드가 된다 (`docs/phase2-notes.md`).
 */
export default async function OnboardingLoginPage({
  searchParams,
}: {
  // Next 16 에서 Promise 다 (session-handoff 4장)
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = (await searchParams).redirect;
  const redirectTo = safeRedirect(typeof raw === "string" ? raw : null);

  return (
    <main className="flex flex-1 flex-col justify-between gap-8 px-5 pt-8 pb-10">
      <div className="flex flex-col gap-6">
        <LoginHero />

        <div className="flex flex-col gap-2">
          <h1 className="text-[24px] leading-8 font-bold text-primary">
            오늘 갈 소개팅,
            <br />
            위치와 분위기로 골라요
          </h1>
          <p className="text-[14px] leading-5 text-text-sub">
            인스타에 흩어진 로테이션 소개팅을 한곳에서 비교해요
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <SocialSignIn redirectTo={redirectTo} />

        {/*
          하단 탭도 헤더도 없는 셸이라 **여기가 막히면 갇힌다.** 게스트가 탭의
          `찜`·`마이` 를 누르면 `checkAccess` 가 실제로 여기로 보낸다 (4.42).
          탐색이 게스트에게 열려 있는 제품이므로 나갈 길을 준다.
        */}
        <Link
          href="/"
          className="inline-flex min-h-11 items-center px-3 text-[13px] font-semibold text-text-sub underline underline-offset-4"
        >
          로그인 없이 둘러보기
        </Link>
      </div>
    </main>
  );
}
