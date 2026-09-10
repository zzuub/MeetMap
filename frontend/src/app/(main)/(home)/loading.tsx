import { HomeFeedSkeleton } from "@/widgets/home-feed";

/**
 * 홈 로딩 폴백 (11.3).
 *
 * ⚠️ **`(home)` 라우트 그룹이 있는 이유가 이 파일이다.** 홈은 `(main)` 세그먼트의
 * 페이지라 `loading.tsx` 를 `(main)/` 에 두면 그 Suspense 경계가 `/likes`·`/my`
 * 까지 덮어, 그 화면들이 **홈 스켈레톤을 폴백으로 상속**한다. 그룹 하나로 경계를
 * 홈에만 맞춘다 — URL 은 그대로 `/` 다 (`decisions.md` 4.41).
 *
 * 헤더(`HomeHeader`)는 여기서 그리지 않는다. 폴백에도 진짜 헤더를 그리면 응답이
 * 온 순간 같은 자리에 같은 것이 한 번 더 마운트된다 — 검색·알림 아이콘이 깜빡인다.
 */
export default function HomeLoading() {
  return <HomeFeedSkeleton />;
}
