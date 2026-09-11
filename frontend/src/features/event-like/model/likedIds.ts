/**
 * 낙관 갱신 한 번 — `LikeProvider` 의 `useOptimistic` 리듀서.
 *
 * 있으면 빼고 없으면 뒤에 붙인다. **찜 목록(9장)은 이 결과로 카드를 지운다** — 여기가
 * 틀리면 누른 카드가 안 사라지거나 엉뚱한 카드가 사라진다. 그래서 훅 밖으로 떼어
 * DOM 없이 잠근다 (`decisions.md` 4.64).
 */
export function toggleLikedId(current: readonly string[], eventId: string): readonly string[] {
  return current.includes(eventId)
    ? current.filter((id) => id !== eventId)
    : [...current, eventId];
}
