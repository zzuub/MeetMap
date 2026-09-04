import { getServerSession } from "@/entities/account/server";
import { eventApi } from "@/entities/event";
import { HomeHeader } from "@/widgets/app-header";
import { HomeFeed } from "@/widgets/home-feed";

/**
 * 홈 `/` (기능정의서 5장).
 *
 * 섹션 B 의 **내용**은 서버가 인증 주체로 판정해 내려주고(13장), 화면은 그 섹션을
 * **보일지 말지**만 정한다. 그래서 세션과 피드는 서로를 기다리지 않는다.
 */
export default async function HomePage() {
  const [session, feed] = await Promise.all([
    getServerSession(),
    eventApi.getHomeFeed({}),
  ]);

  return (
    <>
      {/* 안읽음 도트는 알림 조회가 붙는 P4 에서 실제 값을 받는다 (5-3) */}
      <HomeHeader />
      <HomeFeed
        feed={feed}
        // 가격·자격 기준 주체는 프로필에서 온다. 목 세션에는 출생연도·성별이 없어
        // 프로필 설정(P2-4)이 붙기 전까지는 게스트 기준(남·여 병기)으로 그린다.
        viewer={null}
        // 출생연도 미입력 판정도 프로필이 생긴 뒤다. 지금은 로그인 여부만 본다 (5.3)
        showMyAgeGroup={session !== null}
      />
    </>
  );
}
