import { getAccessToken, getServerSession } from "@/entities/account/server";
import type { EventCardViewer } from "@/entities/event";
import { userApi } from "@/entities/user/server";
import type { Session } from "@/entities/account";

/**
 * 화면이 쓰는 인증 주체 (`decisions.md` 4.44).
 *
 * 두 값을 함께 읽는 이유는 **역할이 다르기 때문**이다.
 * - `session` — 로그인 여부. 화면을 보여줄지 말지를 정한다
 * - `viewer` — 가격 기준 성별과 자격 판정 출생연도. **프로필의 값**이다
 *
 * P2-4 전까지는 둘이 같은 것으로 취급됐다(`isGuest: session === null`). 로그인이
 * 실제로 가능해진 지금은 갈라진다 — **로그인했지만 프로필을 건너뛴 사용자**가
 * 생겼고(3.3 `나중에 할래요` · 3.4 `건너뛰기`), 그 사람에게는 성별이 없어 가격
 * 정렬·자격 필터의 근거가 없다. 판정은 `viewer` 로 한다.
 *
 * `UserProfile` 을 그대로 `viewer` 로 넘긴다 — 구조적으로 `EventCardViewer`
 * (`gender`·`birthYear`)를 만족한다. 타입을 새로 만들지 않는다.
 */
export interface ViewerContext {
  session: Session | null;
  viewer: EventCardViewer | null;
}

export async function loadViewerContext(): Promise<ViewerContext> {
  const [session, accessToken] = await Promise.all([
    getServerSession(),
    getAccessToken(),
  ]);

  if (!session) return { session: null, viewer: null };

  try {
    return { session, viewer: await userApi.getMyProfile({ accessToken }) };
  } catch (error) {
    /*
      **프로필 조회 실패로 화면을 죽이지 않는다.** 실패하면 게스트 기준으로
      떨어져 가격이 남·여 병기가 되고 자격 축이 사라진다 — 덜 개인화됐을 뿐
      화면으로 성립한다. 반대로 에러 카드로 바꾸면 피드가 멀쩡한데 홈이 통째로
      죽는다. `exploreFacets` 가 건수를 포기할 때와 같은 판단이다 (4.28).
    */
    console.warn("[viewer] 프로필 조회 실패 — 게스트 기준으로 그린다", error);
    return { session, viewer: null };
  }
}
