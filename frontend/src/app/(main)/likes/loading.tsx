import { LikedHeader, LikedListSkeleton } from "@/widgets/liked-list";

/**
 * 찜 목록 로딩 폴백 (11.3). 로딩은 화면마다 둔다 (`decisions.md` 4.41).
 * 헤더는 진짜를 그린다 — 조회와 무관하고 `h1` 을 잃지 않는다.
 */
export default function LikesLoading() {
  return (
    <>
      <LikedHeader />
      <LikedListSkeleton />
    </>
  );
}
