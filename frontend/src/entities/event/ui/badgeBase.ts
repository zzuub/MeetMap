/**
 * 배지 공통 형태.
 *
 * 상태·시간대·자격 배지가 같은 크기·라운드로 나란히 놓여야 해서 한 곳에 둔다.
 * 색만 각 배지가 정한다.
 *
 * `shared/ui` 로 올리지 않는 이유: 지금 쓰는 곳이 `entities/event` 뿐이고, 배지
 * 문법이 다른 entity 에서도 같을지는 아직 모른다. 두 번째 사용처가 생기면 올린다.
 */
export const BADGE_BASE =
  "inline-flex items-center rounded-chip px-2 py-[3px] text-[11px] font-bold leading-none whitespace-nowrap";
