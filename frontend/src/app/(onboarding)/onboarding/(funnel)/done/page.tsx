import { AFTER_ONBOARDING } from "@/entities/account";
import { getAccessToken } from "@/entities/account/server";
import { onboardingSummary } from "@/entities/user";
import { userApi } from "@/entities/user/server";
import { loadOrError } from "@/shared/api";
import { ActionLink, ApiErrorScreen } from "@/shared/ui";

/**
 * 온보딩 완료 `/onboarding/done` (3.5 — P2-5).
 *
 * 동적 문구의 재료를 **서버에서 다시 읽는다.** 앞 단계의 클라이언트 상태를 들고
 * 오면 새로고침 한 번에 "아무것도 안 고른 사람" 문구로 떨어진다 — 방금 프로필을
 * 채운 사용자에게 틀린 말을 하게 된다 (`decisions.md` 4.48).
 *
 * ⚠️ **조회 실패를 미선택 문구로 덮지 않는다.** 둘은 다른 상태다 — `프로필 없음`은
 * 3.3·3.4 로 건너뛴 정상 경로이고, 실패는 실패다. 대신 에러 카드 **아래에 홈으로
 * 가는 버튼을 남긴다**: 실패한 것은 요약 문구 하나이고 가입은 이미 끝났다.
 *
 * `홈으로 이동` 의 목적지는 `AFTER_ONBOARDING` 이다 — 3.5 는 위치 권한 화면을
 * 거치라고 적었지만 그 화면은 P2-6 이고, 지금 링크를 걸면 404 로 간다 (4.29).
 */
export default async function OnboardingDonePage() {
  const accessToken = await getAccessToken();
  const loaded = await loadOrError(() => userApi.getMyProfile({ accessToken }));

  return (
    <main className="flex flex-1 flex-col justify-between gap-8 px-5 pt-20 pb-10">
      {loaded.ok ? (
        <div className="flex flex-col items-center gap-3 text-center">
          <span aria-hidden className="text-5xl">
            🎉
          </span>
          <h1 className="text-[22px] leading-7 font-bold text-primary">
            준비가 끝났어요
          </h1>
          <p className="max-w-[280px] text-[14px] leading-5 text-text-sub">
            {onboardingSummary(loaded.data)}
          </p>
        </div>
      ) : (
        <>
          <h1 className="sr-only">온보딩 완료</h1>
          {/* 404 를 없는 페이지로 보내지 않는 쪽이다 — 프로필 미작성은 이미 `null` 로
              내려오므로, 여기 오는 404 는 엔드포인트가 깨진 것이다 (4.40 의 표) */}
          <ApiErrorScreen error={loaded.error} resource="collection" />
        </>
      )}

      <ActionLink href={AFTER_ONBOARDING}>홈으로 이동</ActionLink>
    </main>
  );
}
