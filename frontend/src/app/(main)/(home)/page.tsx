import { eventApi } from "@/entities/event";
import { loadOrError } from "@/shared/api";
import { ApiErrorScreen } from "@/shared/ui";
import { HomeHeader } from "@/widgets/app-header";
import { HomeFeed } from "@/widgets/home-feed";
import { loadViewerContext } from "../../_lib/viewer";

/**
 * 홈 `/` (기능정의서 5장).
 *
 * 섹션 B 의 **내용**은 서버가 인증 주체로 판정해 내려주고(13장), 화면은 그 섹션을
 * **보일지 말지**만 정한다. 그래서 세션과 피드는 서로를 기다리지 않는다.
 *
 * ⚠️ **조회 실패를 올려보내지 않고 여기서 잡는다** — `error.tsx` 에서는 오류 코드·
 * 발생 시각이 이미 사라진 뒤라 11.2 의 에러 카드를 그릴 수 없다. 그리고 **헤더는
 * 실패해도 남긴다**: 죽은 것은 피드 하나인데 헤더까지 지우면 검색·알림으로 나갈
 * 길이 같이 사라진다 (`decisions.md` 4.40).
 */
export default async function HomePage() {
  const [{ viewer }, feed] = await Promise.all([
    loadViewerContext(),
    loadOrError(() => eventApi.getHomeFeed({})),
  ]);

  return (
    <>
      {/* 안읽음 도트는 알림 조회가 붙는 P4 에서 실제 값을 받는다 (5-3) */}
      <HomeHeader />

      {feed.ok ? (
        <HomeFeed
          feed={feed.data}
          // 가격·자격의 기준은 프로필에서 온다. 프로필을 건너뛴 사용자는 `null` 이라
          // 로그인 상태여도 게스트와 같은 표기가 된다 (`decisions.md` 4.44)
          viewer={viewer}
          // 섹션 B(`내 나이대`)는 출생연도가 있어야 성립한다 — 로그인 여부가
          // 아니라 프로필의 유무를 본다 (5.3)
          showMyAgeGroup={viewer !== null}
        />
      ) : (
        <div className="px-5 py-16">
          <ApiErrorScreen error={feed.error} resource="collection" />
        </div>
      )}
    </>
  );
}
