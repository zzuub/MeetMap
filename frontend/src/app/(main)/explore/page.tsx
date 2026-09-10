import { eventApi } from "@/entities/event";
import {
  exploreFacets,
  exploreHref,
  parseExploreParams,
  type RawSearchParams,
} from "@/features/event-filter";
import { loadOrError } from "@/shared/api";
import { ActionLink, ApiErrorScreen } from "@/shared/ui";
import { ExploreBoard } from "@/widgets/explore-board";
import { PhasePlaceholder } from "../../_components/PhasePlaceholder";
import { loadViewerContext } from "../../_lib/viewer";

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
  const [{ viewer }, raw] = await Promise.all([loadViewerContext(), searchParams]);
  const params = parseExploreParams(raw, { hasViewer: viewer !== null });

  /*
    지도는 P3-1 이라 아직 자리표시자다. 뷰 토글을 그리지 않기로 한 이상(4.29) 이
    화면에는 상단 컨트롤이 통째로 없으므로, **리스트로 돌아갈 길을 여기가 준다** —
    홈 지도 프로모 카드(5-6)로 이미 도달 가능한 화면이라 편도가 되면 안 된다.
    걸어둔 조건은 그대로 들고 간다(`exploreHref`).
  */
  if (params.view === "map") {
    return (
      <PhasePlaceholder
        title="지도 뷰"
        phase="Phase 3 · P3-1"
        spec="6.6"
        action={
          <ActionLink href={exploreHref({ ...params, view: "list" })} replace>
            리스트로 보기
          </ActionLink>
        }
      />
    );
  }

  /*
    시간대 칩(6.2)·지역 시트(6.3)가 건수 0인 항목을 감춰야 해서 목록과 함께 받는다.

    **둘을 한 덩어리로 잡는다.** 목록만 오고 패싯이 죽으면 컨트롤이 있는 값을 감추고,
    반대면 결과 없이 컨트롤만 남는다 — 어느 쪽도 화면으로 성립하지 않는다. 부분
    성공을 그리느니 코드가 붙은 에러 카드 하나가 낫다 (11.2 / `decisions.md` 4.40).
  */
  const loaded = await loadOrError(() =>
    Promise.all([
      eventApi.getList({ ...params.query, limit: PAGE_SIZE }),
      exploreFacets(params.query),
    ]),
  );

  if (!loaded.ok) {
    return (
      <div className="px-5 py-16">
        <ApiErrorScreen error={loaded.error} resource="collection" />
      </div>
    );
  }

  const [page, facets] = loaded.data;

  return <ExploreBoard page={page} params={params} facets={facets} viewer={viewer} />;
}

/**
 * 한 번에 받는 건수.
 *
 * 목 8건에서 **다음 페이지를 실제로 눌러볼 수 있어야** 해서 8보다 작게 잡았다.
 * 실 API 의 적정값은 응답 크기를 보고 정한다 — 16장.
 */
const PAGE_SIZE = 6;
