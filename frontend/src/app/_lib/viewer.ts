import { getAccessToken, getServerSession } from "@/entities/account/server";
import type { EventCardViewer } from "@/entities/event";
import { userApi } from "@/entities/user/server";
import { ONBOARDING_ROOT, type Session } from "@/entities/account";

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
  /**
   * 찜한 소개팅 id (9장 · 2.4 `likedIds`).
   *
   * **찜 상태의 원본은 이 배열 하나다** — 화면은 `EventSummary.isLiked` 를 읽지
   * 않는다 (`decisions.md` 4.59). 게스트는 빈 배열이고, 그때 버튼은 로그인으로 간다.
   */
  likedIds: string[];
}

export async function loadViewerContext(): Promise<ViewerContext> {
  const { session, accessToken } = await loadSession();

  if (!session) return { session: null, viewer: null, likedIds: [] };

  try {
    /*
      **둘을 함께 실패시킨다.** 프로필만 오고 찜이 죽으면 하트가 전부 꺼진 채로
      그려져 **사용자가 찜을 지운 것처럼 보인다** — 덜 개인화된 것이 아니라 틀린
      값이다. 4.44 와 같은 판단이되 "한쪽만 와도 화면이 성립하는가"의 답이 아니오다.
    */
    const [viewer, likedIds] = await Promise.all([
      userApi.getMyProfile({ accessToken }),
      userApi.getLikedIds({ accessToken }),
    ]);

    return { session, viewer, likedIds };
  } catch (error) {
    /*
      **프로필 조회 실패로 화면을 죽이지 않는다.** 실패하면 게스트 기준으로
      떨어져 가격이 남·여 병기가 되고 자격 축이 사라진다 — 덜 개인화됐을 뿐
      화면으로 성립한다. 반대로 에러 카드로 바꾸면 피드가 멀쩡한데 홈이 통째로
      죽는다. `exploreFacets` 가 건수를 포기할 때와 같은 판단이다 (4.28).
    */
    console.warn("[viewer] 프로필·찜 조회 실패 — 게스트 기준으로 그린다", error);
    return { session, viewer: null, likedIds: [] };
  }
}

/** 로그인 여부와 API 토큰 */
export async function loadSession(): Promise<{
  session: Session | null;
  accessToken: string | null;
}> {
  const [session, accessToken] = await Promise.all([getServerSession(), getAccessToken()]);
  return { session, accessToken };
}

/**
 * 프로필만. 실패하면 게스트 기준(`null`)으로 떨어진다 — 덜 개인화될 뿐이다 (4.44).
 *
 * ⚠️ **찜 목록은 `loadViewerContext` 대신 이것을 쓴다.** 그 함수는 찜 조회 실패를
 * `[]` 로 삼키는데, 다른 화면에서는 하트가 꺼지는 정도지만 찜 목록에서는
 * `아직 찜한 소개팅이 없어요` 라는 **틀린 빈 상태**가 된다 (`decisions.md` 4.64).
 */
export async function loadViewer(accessToken: string | null): Promise<EventCardViewer | null> {
  try {
    return await userApi.getMyProfile({ accessToken });
  } catch (error) {
    console.warn("[viewer] 프로필 조회 실패 — 게스트 기준으로 그린다", error);
    return null;
  }
}

/**
 * 로그인 화면 주소. 끝나면 **원래 보던 화면으로 되돌린다** — `?redirect=` 는 소비
 * 시점 한 곳(`safeRedirect`)에서 검증되므로 여기서는 만들기만 한다 (`decisions.md` 4.45).
 */
export function signInHref(currentPath: string): string {
  return `${ONBOARDING_ROOT}?redirect=${encodeURIComponent(currentPath)}`;
}

/** 게스트가 찜을 누르면 갈 곳. 로그인 사용자는 `null` 이다 */
export function signInHrefFor(
  session: Session | null,
  currentPath: string,
): string | null {
  return session ? null : signInHref(currentPath);
}
