import { EXPLORE_PATH } from "@/features/event-filter";
import { ActionLink, EmptyState } from "@/shared/ui";
import { AppHeader } from "@/widgets/app-header";

/**
 * 없는 소개팅 (`notFound()` — 11.2).
 *
 * **에러 카드가 아니다.** 404 는 실패가 아니라 답이라 재시도할 대상이 없고, 오류
 * 코드·발생 시각도 CS 식별자로 쓸 일이 없다. 빈 상태 규칙만 지킨다 — **다음 행동을
 * 준다** (`decisions.md` 4.40).
 *
 * 라우트 세그먼트에 두는 이유: 문구가 "그 소개팅이 없다"로 구체적이어서 다른 스택
 * 화면이 같이 쓸 수 없다. 매칭되지 않는 주소 전체는 루트 `not-found.tsx` 가 받는다.
 *
 * ⚠️ 이 화면에 도달하는 흔한 경로는 **공유 링크**다(7.2 `ShareButton`). 마감·삭제된
 * 회차의 링크가 돌아다니므로, 뒤로가기만 주면 앱 밖으로 나간다 — 탐색으로 가는
 * 길을 반드시 함께 준다.
 */
export default function EventNotFound() {
  return (
    <>
      <AppHeader />
      {/* 타이틀 없는 `AppHeader` 를 쓰는 화면의 의무 (4.34) */}
      <h1 className="sr-only">찾을 수 없는 소개팅</h1>

      <EmptyState
        icon="🔎"
        title="찾을 수 없는 소개팅이에요"
        description="주소가 바뀌었거나 주최사가 내린 회차일 수 있어요"
        action={
          <ActionLink href={`${EXPLORE_PATH}?view=list`}>
            다른 소개팅 둘러보기
          </ActionLink>
        }
      />
    </>
  );
}
