import { AFTER_ONBOARDING } from "@/entities/account";
import { getAccessToken } from "@/entities/account/server";
import { userApi } from "@/entities/user/server";
import { LocationPermissionGate } from "@/features/location-permission";
import { loadOrError } from "@/shared/api";
import { ActionLink, ApiErrorScreen } from "@/shared/ui";
import { requireFunnelSession } from "../_guard";
import { resolveLocationAction, savePreferredAreasAction } from "./_actions";

/**
 * 위치 권한 `/onboarding/location` (4장 — P2-6).
 *
 * 퍼널의 마지막 화면이다. 3.5 `홈으로 이동` 이 여기를 거쳐 홈으로 간다.
 *
 * ⚠️ **가드를 스스로 부른다.** 레이아웃 재실행은 `<Link>` 소프트 내비게이션에서
 * 보장되지 않고(4.49), 이 화면은 **선호 지역을 읽는다** — 3.4 에서 이미 고른
 * 지역이 `denied` 화면에 미리 선택돼 있어야 한다. 안 그러면 지역을 2개 골라 둔
 * 사용자가 빈 칩 줄을 보고 1개만 다시 골라 **저장값이 줄어든다.**
 *
 * ⚠️ **조회 실패해도 나갈 길을 남긴다.** `(onboarding)` 은 탭도 헤더도 없는 셸이라
 * 여기가 막히면 갇힌다 — `done/page.tsx` 와 같은 형태다 (4.47 · 4.42).
 * 목적지는 `AFTER_ONBOARDING`(홈)이다. **이 화면 자신이 퍼널의 끝**이라
 * `ONBOARDING_STEPS.location` 을 다시 가리키면 제자리다.
 *
 * 3상태는 URL 도 서버도 아닌 클라이언트 상태에 있다 — 근거는
 * `LocationPermissionGate` 와 `decisions.md` 4.55.
 */
export default async function OnboardingLocationPage() {
  await requireFunnelSession();

  const accessToken = await getAccessToken();
  const loaded = await loadOrError(() => userApi.getMyProfile({ accessToken }));

  if (!loaded.ok) {
    return (
      <main className="flex flex-1 flex-col justify-between gap-8 px-5 pt-20 pb-10">
        <h1 className="sr-only">위치 권한</h1>
        <ApiErrorScreen error={loaded.error} resource="collection" />
        <ActionLink href={AFTER_ONBOARDING}>홈으로 이동</ActionLink>
      </main>
    );
  }

  return (
    <LocationPermissionGate
      initialAreas={loaded.data?.preferredAreas ?? []}
      resolve={resolveLocationAction}
      saveAreas={savePreferredAreasAction}
    />
  );
}
