import { Suspense } from "react";
import { eventApi } from "@/entities/event";
import {
  exploreFacets,
  exploreHref,
  parseExploreParams,
  parseExploreView,
  type ExploreParams,
  type RawSearchParams,
} from "@/features/event-filter";
import { LikeProvider, toggleLikeAction } from "@/features/event-like";
import { loadOrError, type ApiError } from "@/shared/api";
import { ApiErrorScreen } from "@/shared/ui";
import {
  ExploreBoard,
  ExploreBoardSkeleton,
  ExploreMapBoard,
} from "@/widgets/explore-board";
import { loadViewerContext, signInHrefFor, type ViewerContext } from "../../_lib/viewer";

/**
 * 탐색 `/explore` (기능정의서 6장).
 *
 * **URL 이 필터 상태의 원본이다** (2.4). 페이지는 쿼리스트링을 조회 파라미터로
 * 옮기기만 하고 상태를 들지 않는다 — 새로고침·뒤로가기·공유가 그래서 그냥 된다.
 *
 * ⚠️ **인증 축의 게이트는 세션이 아니라 프로필(`viewer`)이다** — 로그인만 하고
 * 프로필을 건너뛴 사용자에게 가격 정렬·자격 필터를 열면 판정 근거가 없다
 * (`decisions.md` 4.44).
 */
export default async function ExplorePage({
  searchParams,
}: {
  // Next 16 에서 Promise 다 (session-handoff 4장)
  searchParams: Promise<RawSearchParams>;
}) {
  const raw = await searchParams;

  /*
    **폴백은 뷰마다 모양이 다르다** — 리스트는 카드, 지도는 지도 로딩 오버레이(11.3).
    `loading.tsx` 는 쿼리를 못 봐서 두 뷰에 공통인 윗부분까지만 그리고, 나머지는 뷰를 아는
    여기서 고른다. 뷰는 인증 주체와 무관해 프로필을 읽기 전에 안다 (`decisions.md` 4.71).
  */
  return (
    <Suspense fallback={<ExploreBoardSkeleton view={parseExploreView(raw)} />}>
      <ExploreContent raw={raw} />
    </Suspense>
  );
}

async function ExploreContent({ raw }: { raw: RawSearchParams }) {
  const context = await loadViewerContext();
  const params = parseExploreParams(raw, { hasViewer: context.viewer !== null });

  return params.view === "map" ? (
    <MapView params={params} />
  ) : (
    <ListView params={params} context={context} />
  );
}

/*
  두 뷰 다 시간대 칩(6.2)·지역 시트(6.3)가 건수 0인 항목을 감춰야 해서 결과와 함께 받는다.

  **둘을 한 덩어리로 잡는다.** 결과만 오고 패싯이 죽으면 컨트롤이 있는 값을 감추고,
  반대면 결과 없이 컨트롤만 남는다 — 어느 쪽도 화면으로 성립하지 않는다. 부분
  성공을 그리느니 코드가 붙은 에러 카드 하나가 낫다 (11.2 / `decisions.md` 4.40).
*/
async function ListView({
  params,
  context,
}: {
  params: ExploreParams;
  context: ViewerContext;
}) {
  const loaded = await loadOrError(() =>
    Promise.all([
      eventApi.getList({ ...params.query, limit: PAGE_SIZE }),
      exploreFacets(params.query),
    ]),
  );
  if (!loaded.ok) return <ExploreError error={loaded.error} />;

  const [page, facets] = loaded.data;

  return (
    <LikeProvider
      liked={context.likedIds}
      // 걸어 둔 조건까지 들고 돌아온다 — 게스트가 필터를 다시 짜지 않게 한다
      signInHref={signInHrefFor(context.session, exploreHref(params))}
      toggleLike={toggleLikeAction}
    >
      <ExploreBoard page={page} params={params} facets={facets} viewer={context.viewer} />
    </LikeProvider>
  );
}

/**
 * 지도 뷰 (6.6). 마커는 **조건의 전건**이다 — `bbox` 를 보내지 않는다. 그래서 뷰포트를
 * 옮겨도 다시 조회하지 않고, 클라이언트 조회 자리·응답 경합·캐시가 생기지 않는다
 * (`decisions.md` 4.71 · 4.58). 실패는 리스트와 같은 에러 카드다 — 4.40 표에 줄이 늘지 않는다.
 */
async function MapView({ params }: { params: ExploreParams }) {
  const loaded = await loadOrError(() =>
    Promise.all([eventApi.getMapMarkers(params.query), exploreFacets(params.query)]),
  );
  if (!loaded.ok) return <ExploreError error={loaded.error} />;

  const [events, facets] = loaded.data;
  return <ExploreMapBoard events={events} params={params} facets={facets} />;
}

function ExploreError({ error }: { error: ApiError }) {
  return (
    <div className="px-5 py-16">
      <ApiErrorScreen error={error} resource="collection" />
    </div>
  );
}

/**
 * 한 번에 받는 건수.
 *
 * 목 8건에서 **다음 페이지를 실제로 눌러볼 수 있어야** 해서 8보다 작게 잡았다.
 * 실 API 의 적정값은 응답 크기를 보고 정한다 — 16장.
 */
const PAGE_SIZE = 6;
