import { VariantBlock } from "./layout";
import type { CardShowcaseContext } from "./cardShowcase";

/** 카드 변형 — 14.1 의 다섯 + 찜 목록 `liked` (4.63) */
export function VariantSection({ events, card, sample }: CardShowcaseContext) {
  return (
    <>
  <VariantBlock
    name="feature"
    spec="홈 가로 스크롤 · 196px / 썸네일 118px (5.3 섹션 A) — 상태 배지 없음(4.23)"
  >
    {/* 가로 스크롤은 홈 카드 캐러셀만 허용된 예외다 (6.2) */}
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
      {events.slice(0, 3).map((event) => card(event, "feature"))}
    </div>
  </VariantBlock>

  <VariantBlock
    name="ratio"
    spec="홈 `내 나이대` · 196px + 정원 `남 N · 여 N` (5.3 섹션 B) — 성비 바 아님"
  >
    <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
      {events.slice(0, 3).map((event) => card(event, "ratio"))}
    </div>
  </VariantBlock>

  <VariantBlock
    name="compact"
    spec="홈 `새로 등록된` · 썸네일 64px (5.3 섹션 C) — 상태 배지 없음(4.23)"
  >
    <div className="flex flex-col gap-2">
      {events.slice(0, 2).map((event) => card(event, "compact"))}
    </div>
  </VariantBlock>

  <VariantBlock name="list" spec="탐색 리스트 · 검색 결과 · 썸네일 92px (6.5)">
    <div className="flex flex-col gap-2">
      {events.slice(0, 2).map((event) => card(event, "list"))}
    </div>
  </VariantBlock>

  <VariantBlock name="sheet" spec="지도 마커 시트 · 썸네일 88px (6.6)">
    {card(sample(1), "sheet")}
  </VariantBlock>

  <VariantBlock
    name="liked"
    spec="찜 목록 · 썸네일 66px · 상태 배지 (9장) — 마감돼도 남는다 → 4.63"
  >
    <div className="flex flex-col gap-2">
      {events.slice(0, 2).map((event) => card(event, "liked"))}
    </div>
  </VariantBlock>
    </>
  );
}
