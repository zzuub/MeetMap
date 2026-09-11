import { ALL_VARIANTS, BOUNDARY_CASES, type CardShowcaseContext } from "./cardShowcase";

/** 목 데이터 경계값이 변형마다 어떻게 떨어지는지 */
export function BoundarySection({ card, pick }: CardShowcaseContext) {
  return (
    <>
  <ul
    className={[
      "flex list-disc flex-col gap-1.5 rounded-card border border-border",
      "bg-surface p-4 pl-8 text-[12px] leading-5 text-text-sub",
      // JSX 는 태그와 줄바꿈 사이의 공백을 지운다. 코드 조각에 여백을 직접 준다
      "[&_code]:mx-0.5 [&_code]:rounded-[4px] [&_code]:bg-accent-soft [&_code]:px-1",
    ].join(" ")}
  >
    <li>
      <b className="text-text">가격 미확인</b> — 모든 변형이 <code>링크 확인</code>.
      <code>0원</code>·<code>무료</code> 로 읽힐 문구를 쓰지 않는다.
    </li>
    <li>
      <b className="text-text">이미지 미동의</b> — 모든 변형이 주최사 이름이 든 대체
      표시. 폭이 좁은 <code>compact</code>·<code>list</code>·<code>sheet</code>·
      <code>liked</code> 는 이름을 숨기고 마크만 남긴다. 이미지가 없다고 소개팅을
      숨기지 않는다.
    </li>
    <li>
      <b className="text-text">마감</b> — 상태 배지는 <code>list</code>·
      <code>sheet</code>·<code>liked</code> 에만 있다. <b className="text-text">홈은
      마감을 아예 받지 않으므로</b>(5.3 · <code>getHomeFeed</code> 세 섹션 전부 모집 중)
      홈에 쓰는 세 변형에는 배지를 두지 않는다 — 같은 값만 찍히는 배지는 정보가
      아니다 → 4.23. 찜 목록은 마감돼도 남아(9장) <code>compact</code> 에 조건을 붙이지
      않고 <code>liked</code> 를 따로 뒀다 → 4.63.
    </li>
    <li>
      <b className="text-text">평점</b> — 어느 변형에도 없다. 2026-09-02 재정의로{" "}
      <b className="text-text">회차 평점이 삭제됐다</b> — 사용자가 평점을 보는
      시점은 회차가 열리기 전이라 신규 회차는 정의상 후기 0건이다. 평점은
      주최사에 쌓이고, 상세의 주최사 블록(7.1)·주최사 페이지(7.4)·비교함(8장)에서
      나온다.
    </li>
  </ul>

  {BOUNDARY_CASES.map((boundary) => {
    const event = pick(boundary.id);
    if (!event) return null;

    return (
      <div key={boundary.id} className="flex flex-col gap-2">
        <p className="text-[13px] font-bold text-primary">
          {boundary.label}{" "}
          <span className="font-medium text-text-sub">
            — {boundary.id} · {boundary.note}
          </span>
        </p>
        <div className="-mx-5 flex items-start gap-3 overflow-x-auto px-5 pb-1">
          {ALL_VARIANTS.map((variant) => (
            <div
              key={variant}
              className="flex w-[280px] shrink-0 flex-col gap-1"
            >
              <span className="text-[11px] text-text-sub">{variant}</span>
              {card(event, variant)}
            </div>
          ))}
        </div>
      </div>
    );
  })}
    </>
  );
}
