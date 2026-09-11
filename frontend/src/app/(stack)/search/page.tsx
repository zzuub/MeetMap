import { eventApi, orderUpcomingFirst } from "@/entities/event";
import { searchApi, type TrendingSnapshot } from "@/entities/search";
import { LikeProvider, toggleLikeAction } from "@/features/event-like";
import {
  isTrending,
  parseSearchParams,
  searchHref,
  suggestKeywords,
  type RawSearchParams,
} from "@/features/event-search";
import { loadOrError } from "@/shared/api";
import { ApiErrorScreen } from "@/shared/ui";
import {
  SearchEmpty,
  SearchIdle,
  SearchResults,
  SearchStatus,
} from "@/widgets/search-board";
import { loadViewerContext, signInHrefFor } from "../../_lib/viewer";

/**
 * 검색 `/search` (11.1).
 *
 * **검색어는 URL(`?q=`)이 원본이고 조회는 여기서 한다** — 실패가 4.40 의 첫째 자리
 * (`ApiErrorScreen`)로 오고, 새로고침·직접 진입·뒤로가기가 한 경로다. 입력창과 debounce 는
 * `layout.tsx` 의 `SearchProvider` 가 맡는다 (`decisions.md` 4.66 — 상태 × 진입 경로 표).
 *
 * ⚠️ **모든 분기가 `SearchStatus` 를 맨 앞에 둔다** — 같은 자리의 live region 이어야 바뀐
 * 결과가 스크린리더에 읽힌다.
 */
export default async function SearchPage({
  searchParams,
}: {
  // Next 16 에서 Promise 다 (session-handoff 4장)
  searchParams: Promise<RawSearchParams>;
}) {
  const { keyword } = parseSearchParams(await searchParams);

  if (keyword === null) {
    const trending = await loadTrending();

    return (
      <>
        <SearchStatus state={{ kind: "idle" }} />
        <SearchIdle trending={trending} />
      </>
    );
  }

  /*
    찜 조회가 죽으면 하트가 꺼질 뿐이다 — 목록이 찜에 기대지 않으므로 `loadViewerContext`
    가 맞다. 찜 목록이 이 함수를 버린 이유(틀린 빈 상태)가 여기에는 없다 (4.64 · 4.67)
  */
  const [{ session, viewer, likedIds }, found] = await Promise.all([
    loadViewerContext(),
    loadOrError(() => eventApi.search(keyword)),
  ]);

  if (!found.ok) {
    return (
      <>
        <SearchStatus state={{ kind: "failed" }} />
        <div className="px-5 py-16">
          <ApiErrorScreen error={found.error} resource="collection" />
        </div>
      </>
    );
  }

  if (found.data.length === 0) {
    const trending = await loadTrending();

    /*
      계약 위반의 **관측 지점** — 인기 검색어가 0건을 냈다(`ENDPOINTS.search.trending` 5번).
      막지 않는다: 화면은 이미 성립하고(추천 칩에서 이 검색어는 빠진다), 막으려면 인기
      검색어마다 검색을 더 돌려야 한다. `exploreFacets` 의 `console.warn` 과 같은 자리다 (4.68)
    */
    if (isTrending(trending, keyword)) {
      console.warn(
        `[search] 인기 검색어가 0건을 냈다 — 계약 위반(ENDPOINTS.search.trending 5번) · ${keyword} · 스냅샷 ${trending?.baseAt}`,
      );
    }

    return (
      <>
        <SearchStatus state={{ kind: "empty", keyword }} />
        <SearchEmpty keyword={keyword} suggestions={suggestKeywords(trending, keyword)} />
      </>
    );
  }

  return (
    <>
      <SearchStatus state={{ kind: "results", count: found.data.length }} />
      <LikeProvider
        liked={likedIds}
        // 로그인 뒤 **같은 검색 결과로** 돌아온다 — `safeRedirect` 가 소비 시점에 검증한다 (4.45)
        signInHref={signInHrefFor(session, searchHref(keyword))}
        toggleLike={toggleLikeAction}
      >
        <SearchResults
          // 서버에서 한 번 정렬한다 — 클라이언트가 `new Date()` 를 다시 읽으면 KST 자정
          // 무렵 서버와 다른 순서를 그려 하이드레이션이 어긋난다 (4.65 · 4.70)
          events={orderUpcomingFirst(found.data, new Date())}
          keyword={keyword}
          viewer={viewer}
        />
      </LikeProvider>
    </>
  );
}

/**
 * 인기 검색어. **실패해도 화면을 죽이지 않는다** — `idle` 은 그 섹션만, 결과 없음은 추천
 * 칩만 빠진다. 입력창과 최근 검색어로 화면이 성립한다 (`decisions.md` 4.68).
 */
async function loadTrending(): Promise<TrendingSnapshot | null> {
  const loaded = await loadOrError(() => searchApi.getTrending());
  if (loaded.ok) return loaded.data;

  console.warn(
    `[search] 인기 검색어 조회 실패 — 섹션을 그리지 않는다 · ${loaded.error.code} · ${loaded.error.occurredAt.toISOString()}`,
  );
  return null;
}
