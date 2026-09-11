import { redirect } from "next/navigation";
import { eventApi, orderUpcomingFirst } from "@/entities/event";
import { userApi } from "@/entities/user/server";
import { LikeProvider, toggleLikeAction } from "@/features/event-like";
import { loadOrError } from "@/shared/api";
import { ApiErrorScreen } from "@/shared/ui";
import { LikedHeader, LikedList } from "@/widgets/liked-list";
import { loadSession, loadViewer, signInHref } from "../../_lib/viewer";

const LIKES_PATH = "/likes";

/**
 * 찜 목록 `/likes` (9장).
 *
 * 본문은 두 번에 받는다 — 찜 id(`userApi`) → 회차(`eventApi.getByIds`). `?expand=` 로
 * 합치지 않은 이유는 `decisions.md` 4.62.
 *
 * ⚠️ **`loadViewerContext` 를 쓰지 않는다.** 그 함수는 찜 조회 실패를 `[]` 로 삼키는데
 * 여기서 그러면 `아직 찜한 소개팅이 없어요` 가 뜬다. 찜 조회는 `loadOrError` 로 잡아
 * 11.2 에러 카드를 그리고, 프로필만 게스트 기준으로 떨어뜨린다 (4.64).
 *
 * ⚠️ **세션이 없으면 여기서도 로그인으로 보낸다.** `proxy.ts` 는 UX 가드라(4.12) 만료된
 * 토큰도 통과시킨다 — 그대로 그리면 게스트에게 빈 상태를 보여 준다.
 */
export default async function LikesPage() {
  const { session, accessToken } = await loadSession();
  if (!session) redirect(signInHref(LIKES_PATH));

  const [viewer, liked] = await Promise.all([
    loadViewer(accessToken),
    loadOrError(async () => {
      const ids = await userApi.getLikedIds({ accessToken });
      return { ids, events: await eventApi.getByIds(ids) };
    }),
  ]);

  return (
    <>
      <LikedHeader />

      {liked.ok ? (
        <LikeProvider liked={liked.data.ids} toggleLike={toggleLikeAction}>
          <LikedList
            // 서버에서 한 번 정렬한다 — 클라이언트가 `new Date()` 를 다시 읽으면 KST
            // 자정 무렵 서버와 다른 순서를 그려 하이드레이션이 어긋난다
            events={orderUpcomingFirst(liked.data.events, new Date())}
            viewer={viewer}
          />
        </LikeProvider>
      ) : (
        <div className="px-5 py-16">
          <ApiErrorScreen error={liked.error} resource="collection" />
        </div>
      )}
    </>
  );
}
