import type { ReactNode } from "react";
import { EmptyState } from "@/shared/ui";

interface PhasePlaceholderProps {
  /** 화면 이름 */
  title: string;
  /** 이 화면을 만드는 단계. 예: "Phase 1 · P1-3" */
  phase: string;
  /** 기능정의서 참조 장. 예: "5장" */
  spec: string;
  /**
   * 여기서 나갈 길. **다른 화면에서 이미 도달 가능한 자리표시자에는 필요하다** —
   * 셸 밖으로 조기 반환하면 하단 탭 말고는 되돌아갈 수단이 없다 (11.2 "빈 상태는
   * 다음 행동을 제시한다").
   */
  action?: ReactNode;
}

/**
 * Phase 0 단계의 자리표시자.
 *
 * 셸·내비게이션·라우트 가드를 실제로 눌러보려면 각 경로에 페이지가 있어야 한다.
 * 해당 Phase에서 실제 화면으로 교체되며, 그때 이 컴포넌트 참조가 사라진다.
 * (전부 사라지면 `_components/` 폴더째 삭제한다.)
 */
export function PhasePlaceholder({
  title,
  phase,
  spec,
  action,
}: PhasePlaceholderProps) {
  return (
    <EmptyState
      icon="🚧"
      title={title}
      description={`${phase} 에서 구현합니다. 사양: 기능정의서 ${spec}`}
      action={action}
    />
  );
}
