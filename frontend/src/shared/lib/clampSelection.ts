/**
 * 상한이 있는 다중 선택 토글 (3.4 관심 카테고리 5개 / 선호 지역 3개, 8장 비교함 3개).
 *
 * 목업은 한도 초과 시 클릭을 그냥 무시해 사용자가 원인을 알 수 없었다(16장 지적).
 * 그래서 "무시했다"는 사실을 `exceeded` 로 돌려준다 — 호출부가 토스트를 띄운다.
 */
export interface ClampSelectionResult<T> {
  next: T[];
  /** 한도 때문에 추가가 거부됐다. 호출부는 이때 토스트를 띄운다. */
  exceeded: boolean;
}

export function clampSelection<T>(
  current: readonly T[],
  value: T,
  max: number,
): ClampSelectionResult<T> {
  if (current.includes(value)) {
    return { next: current.filter((v) => v !== value), exceeded: false };
  }

  if (current.length >= max) {
    return { next: [...current], exceeded: true };
  }

  return { next: [...current, value], exceeded: false };
}
