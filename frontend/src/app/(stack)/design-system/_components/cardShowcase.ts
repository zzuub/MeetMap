import type {
  EventCardVariant,
  EventCardViewer,
  EventStatus,
  EventSummary,
  TimeSlot,
  ViewerGender,
} from "@/entities/event";
import type { ReactNode } from "react";

/**
 * 카드 관련 섹션 3종이 공유하는 값.
 *
 * `viewer` 기준을 바꾸면 가격·자격 배지가 세 섹션에서 함께 바뀌어야 하므로
 * 상태는 `EventCardShowcase` 하나가 들고, 섹션들은 렌더 함수만 받는다.
 */
export interface CardShowcaseContext {
  events: EventSummary[];
  /** 지정한 변형으로 카드를 그린다. 액션 슬롯은 변형에 맞는 것이 붙는다 */
  card: (event: EventSummary, variant: EventCardVariant) => ReactNode;
  pick: (id: string) => EventSummary | undefined;
  sample: (index: number) => EventSummary;
}

/** 가격·자격 기준 주체. 목 모드 인증 주체(`MOCK_VIEWER`)가 1996년생 여성이라 기본값을 맞춘다 */
export const VIEWERS: { code: string; label: string; viewer: EventCardViewer | null }[] = [
  { code: "F", label: "여성 96", viewer: { gender: "F", birthYear: 1996 } },
  { code: "M", label: "남성 94", viewer: { gender: "M", birthYear: 1994 } },
  { code: "GUEST", label: "게스트", viewer: null },
];

/** 목 데이터에 심어 둔 경계값 (`entities/event/mock/events.ts`) */
export const BOUNDARY_CASES = [
  { id: "evt-004", label: "가격 미확인", note: "malePrice·femalePrice 가 모두 null" },
  {
    id: "evt-006",
    label: "이미지 미동의",
    note: "thumbnailUrl 이 null — 주최사 단위 동의라 prv-004 회차는 둘 다 비어 있다 (7.2)",
  },
  {
    id: "evt-007",
    label: "마감",
    note: "인기 상위인데 마감된 건 — 홈은 이 건을 받지 않는다 (5.3)",
  },
];

export const ALL_VARIANTS: EventCardVariant[] = ["feature", "ratio", "compact", "list", "sheet"];

/** P1-2 DoD — 상태 2종 */
export const ALL_STATUSES: EventStatus[] = ["신청 가능", "마감"];

/** P1-2 DoD — 시간대 4종. 경계는 시작 시각 기준이다 (6.2) */
export const ALL_SLOTS: TimeSlot[] = ["MORNING", "AFTERNOON", "DINNER", "LATE_NIGHT"];

/** P1-2 DoD — 성별 기준 가격. 게스트(`null`)는 병기한다 */
export const PRICE_BASES: { label: string; gender: ViewerGender | null }[] = [
  { label: "여성 기준", gender: "F" },
  { label: "남성 기준", gender: "M" },
  { label: "게스트 (병기)", gender: null },
];
