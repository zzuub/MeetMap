import { emptyRelaxation, type ExploreParams } from "@/features/event-filter";
import { ActionLink, EmptyState } from "@/shared/ui";

/**
 * 필터 결과 없음 (11.2) — 리스트와 지도가 같은 것을 그린다.
 *
 * **문구로 끝내지 않고 다음 행동을 준다.** 그 액션이 상수가 아닌 이유는
 * `emptyRelaxation` 에 있다 — 칩이 하나도 없는 0건에서 `필터 초기화` 는 아무것도
 * 바꾸지 않는 링크가 된다.
 *
 * **적용 필터 칩 줄을 여기서 다시 그리지 않는다** — 6.2 가 상시 노출하므로 같은
 * 정보가 두 번 뜬다 (11.2 명시).
 */
export function ExploreEmpty({ params }: { params: ExploreParams }) {
  const relaxation = emptyRelaxation(params);

  // 걸린 조건이 없는데 0건이면 "필터를 풀어보세요"가 거짓말이다 — 풀 것이 없다
  if (relaxation === null) {
    return (
      <EmptyState
        icon="🌱"
        title="아직 등록된 소개팅이 없어요"
        description="새 소개팅이 올라오면 여기에서 바로 볼 수 있어요"
      />
    );
  }

  return (
    <EmptyState
      icon="🔍"
      title="조건에 맞는 소개팅이 없어요"
      description="적용한 필터를 하나씩 풀어보면 더 많은 소개팅을 볼 수 있어요"
      action={
        <ActionLink href={relaxation.href} replace scroll={false}>
          {relaxation.label}
        </ActionLink>
      }
    />
  );
}
