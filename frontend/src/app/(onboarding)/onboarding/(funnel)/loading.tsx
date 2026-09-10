import { Skeleton } from "@/shared/ui";

/**
 * 온보딩 퍼널 공통 로딩 폴백 (11.3).
 *
 * 4.41 은 로딩을 **화면마다** 두라고 적었고 근거는 "모양이 다르다"였다 — 홈
 * 스켈레톤과 탐색 스켈레톤은 실제로 다르다. **퍼널 다섯은 그 근거가 성립하지
 * 않는다.** 다섯 다 제목 한 줄 + 입력 블록 + 하단 버튼이고, 스켈레톤으로 흉내낼
 * 콘텐츠 모양이 없다. 복사하면 같은 파일이 다섯이 된다 (`decisions.md` 4.47).
 *
 * 폴백이 뜨는 자리는 진입 조회가 있는 둘이다 — `/onboarding/done`(프로필 조회)과
 * `/onboarding/location`(선호 지역 조회).
 */
export default function OnboardingFunnelLoading() {
  return (
    <div className="flex flex-1 flex-col gap-6 px-5 pt-10 pb-8">
      <Skeleton className="h-7 w-2/3" />
      <Skeleton className="h-4 w-1/2" />

      <div className="mt-2 flex flex-col gap-3">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>

      <Skeleton className="mt-auto h-12 w-full" />
    </div>
  );
}
