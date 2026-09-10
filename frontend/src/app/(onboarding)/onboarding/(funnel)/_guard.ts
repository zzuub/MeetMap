import { redirect } from "next/navigation";
import { ONBOARDING_STEPS, type Session } from "@/entities/account";
import { getServerSession } from "@/entities/account/server";

/**
 * 퍼널 단계는 세션이 있어야 한다 (3.2~3.5 · 4장).
 *
 * `PUBLIC_PREFIXES` 가 `/onboarding` **전체**를 게스트에게 열어 둔다 — 로그인
 * 화면이 그 안에 있으니 그래야 한다. 그래서 `checkAccess` 는 `/onboarding/profile`
 * 도 통과시키고, 막는 것은 이 함수뿐이다.
 *
 * ## 레이아웃만으로는 부족하다 (`decisions.md` 4.49)
 *
 * 레이아웃 하나로 끝날 줄 알았는데 **`(funnel)/layout.tsx` 의 재실행이 모든
 * 이동에서 보장되지는 않는다.** 찍어서 확인했다.
 *
 * | 전환 | 레이아웃 재실행 |
 * | --- | --- |
 * | 하드 로드 · 새로고침 · 손으로 친 URL | ✅ 항상 |
 * | Server Action 의 `redirect()` (약관→인트로, 프로필→완료) | ✅ 항상 |
 * | **`<Link>` 소프트 내비게이션** (인트로→프로필, 건너뛰기→완료) | ⚠️ **보장 없음** |
 *
 * 마지막 줄은 두 번 측정해 답이 달랐다 — 한 번은 아예 안 돌았고, 한 번은 (프리페치로
 * 보이는) 호출이 있었다. **타이밍에 기대는 가드는 가드가 아니다.**
 *
 * ## 그래서 어느 자리가 스스로 부르나 — **진입점 아홉을 다 적는다**
 *
 * 기준은 **쓰기냐 읽기냐가 아니라 "세션에 딸린 일을 하는가"** 다. 처음에는 쓰기만
 * 세어 `done` 을 빠뜨렸고 (PR #35 2차 리뷰), 그 다음에는 **단계**로 세어 한 단계
 * 안의 진입점 차이를 못 봤다 (PR #36 2차 리뷰 → 4.57).
 *
 * | 진입점 | 세션에 딸린 일 | 부르나 |
 * | --- | --- | --- |
 * | `terms/page` (3.2) | **없다** — 빈 동의 폼 | ❌ 사유 |
 * | `terms/agreeTermsAction` | 약관 **저장** | ✅ |
 * | `intro/page` (3.3) | **없다** — 정적 안내 | ❌ 사유 |
 * | `profile/page` (3.4) | **없다** — 빈 입력 폼 | ❌ 사유 |
 * | `profile/saveProfileAction` | 프로필 **저장** | ✅ |
 * | `done/page` (3.5) | 프로필 **조회** | ✅ |
 * | `location/page` (4장) | 선호 지역 **조회**(초기 선택) | ✅ |
 * | `location/resolveLocationAction` | **없다** — 좌표→지명·건수 | ❌ 사유 |
 * | `location/savePreferredAreasAction` | 선호 지역 **저장** | ✅ |
 *
 * ⚠️ **`location` 한 폴더에 ✅ 와 ❌ 가 섞여 있다.** 단계 단위로 세던 때는 이 차이가
 * 보이지 않았고, 세어 보니 `terms/page`·`profile/page` 도 같은 이유로 무임승차
 * 중이었다 — 표가 다섯 줄이 아니라 아홉 줄이어야 했다 (4.57).
 *
 * **남는 한계**: 세션에 딸린 일이 없는 화면(`intro`)은 세션이 죽어도 그려진다.
 * 데이터가 없으니 새는 것도 없고, 다음 걸음에서 걸린다.
 *
 * 규칙의 **구현은 이 함수 하나**다. 부르는 자리를 늘리더라도 판정을 복사하지 않는다.
 * ⚠️ **위 표는 사람이 세지 않는다** — `_guard.test.ts` 가 폴더를 훑어 강제한다 (4.51).
 */
export async function requireFunnelSession(): Promise<Session> {
  const session = await getServerSession();
  if (!session) redirect(ONBOARDING_STEPS.login);

  return session;
}

/**
 * **가드를 스스로 안 부르는 서버 진입점과 그 사유** (`decisions.md` 4.51 · 4.57).
 *
 * `_guard.test.ts` 가 `(funnel)/` 의 **진입점 하나하나**를 훑어 `requireFunnelSession`
 * 호출을 요구하고, 여기 적힌 것만 통과시킨다. **새 진입점을 만들고 아무것도 안 하면
 * 테스트가 깨진다** — 가드를 부르거나, 왜 필요 없는지를 여기 한 줄로 적어야 한다.
 *
 * ## 왜 단계가 아니라 진입점인가 (4.57)
 *
 * 처음에는 키가 **단계**(`intro`)였다. 그런데 판정이 "폴더 어딘가에 호출이 하나라도
 * 있는가" 라서, 한 폴더 안에 가드가 필요한 자리와 필요 없는 자리가 섞이면
 * **아무것도 보장하지 못한다.** P2-6 의 `location/` 이 정확히 그 모양이고
 * (`resolveLocationAction` 은 일부러 안 부른다), 그때 `savePreferredAreasAction` 의
 * 가드를 지워도 같은 폴더의 `page.tsx` 덕에 테스트가 조용했다 — **2차 리뷰가 찾은
 * `done` 누락과 같은 모양**이다. 세어 보니 `terms/page`·`profile/page` 도 같은
 * 이유로 무임승차하고 있었다.
 *
 * **레이아웃 재실행 없이 서버에 닿는 자리가 곧 진입점**이다 (4.49) — 페이지 렌더와
 * Server Action 하나하나. 이 폴더 모양에서는 그 둘이 전부다.
 *
 * ⚠️ **비어 있는 채로 두지 않는다.** 사유가 값이다.
 */
export const NO_SESSION_ENTRIES: Record<string, string> = {
  "intro/page": "정적 안내뿐이다 — 서버에서 읽는 것도 쓰는 것도 없다 (3.3)",
  "terms/page": "빈 동의 폼이다. 세션에 딸린 일은 제출뿐이고 그건 액션이 막는다 (3.2)",
  "profile/page": "빈 입력 폼이다. 세션에 딸린 일은 제출뿐이고 그건 액션이 막는다 (3.4)",
  "location/resolveLocationAction":
    "좌표→지명·지역별 건수는 게스트가 `/explore` 에서 그대로 보는 값이라 세션에 딸려 있지 않다 (4.54)",
};
