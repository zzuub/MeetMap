import { ActionLink, Numeric, PrimaryButton } from "@/shared/ui";
import type { NearbySummary } from "../model/types";

/**
 * `granted` — 위치 확정 (4.2).
 *
 * ⚠️ **`반경 3km` 를 쓰지 않는다.** 4.2 는 요약 카드에 `{동} · 반경 3km` 를 적었지만
 * 반경으로 좁히는 축이 `EventListQuery` 에 없다 — 카드가 3km 라고 하고 `주변
 * 소개팅 보기` 가 지역 전체를 보여주면 **두 숫자가 어긋난다.** 카드와 링크의 축을
 * 지역 하나로 맞췄다 (`decisions.md` 4.53·4.56).
 *
 * ⚠️ **`권한 요청 화면 다시 보기`(4.2)를 `지역 직접 선택할게요` 로 바꿨다.** 4.2 가
 * 실서비스 노출을 TBD 로 남긴 컨트롤인데, 없애면 권한을 허용한 사용자가 지역을
 * 직접 고를 길이 사라져 상태가 일방통행이 된다. 프로토타입 확인용이 아니라
 * **되돌리기**로 세운다 (`decisions.md` 4.55).
 */
export function LocationGranted({
  summary,
  onChooseArea,
}: {
  summary: NearbySummary;
  onChooseArea: () => void;
}) {
  const { today } = summary.counts;

  return (
    <main className="flex flex-1 flex-col justify-between gap-8 px-5 pt-16 pb-10">
      <div className="flex flex-col items-center gap-5 text-center">
        <span aria-hidden className="text-5xl">
          📍
        </span>

        <h1 className="max-w-[300px] text-[20px] leading-7 font-bold text-primary">
          <Headline summary={summary} />
        </h1>

        <dl className="w-full rounded-card border border-border bg-surface px-4 py-4 text-left">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-[12px] font-semibold text-text-sub">기준 지역</dt>
            <dd className="text-[14px] font-bold text-text">{summary.label}</dd>
          </div>

          {/* 못 셌으면 줄 자체를 그리지 않는다 — 침묵하는 오답보다 낫다 (4.28) */}
          {today ? (
            <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-border pt-2.5">
              <dt className="text-[12px] font-semibold text-text-sub">오늘</dt>
              <dd className="text-[14px] font-bold text-text">
                저녁 <Numeric>{today.dinner}</Numeric>건 · 심야{" "}
                <Numeric>{today.lateNight}</Numeric>건
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-col gap-2">
        <ActionLink
          href={summary.href}
          className="min-h-[48px] rounded-button border-0 bg-accent text-[15px] font-bold text-text"
        >
          주변 소개팅 보기
        </ActionLink>

        <PrimaryButton variant="ghost" onClick={onChooseArea}>
          지역 직접 선택할게요
        </PrimaryButton>
      </div>
    </main>
  );
}

/**
 * 4.2 의 확정 문구.
 *
 * 0건에서 갈라지는 이유는 `0건을 찾았습니다` 가 찾았다는 말과 못 찾았다는 말을
 * 동시에 하기 때문이다. 0건이어도 `주변 소개팅 보기` 는 남는다 — 오늘 없다고
 * 그 지역 전체가 비어 있는 것은 아니고, 11.2 는 빈 상태에도 다음 걸음을 요구한다.
 *
 * 건수를 `Numeric` 으로 감싸야 해서 문자열이 아니라 조각이다 (2.2).
 */
function Headline({ summary: { label, counts } }: { summary: NearbySummary }) {
  if (counts.total === 0) return <>{label} 기준으로 주변 소개팅을 아직 못 찾았어요</>;

  return (
    <>
      {label} 기준으로 주변 소개팅 <Numeric>{counts.total}</Numeric>건을 찾았습니다
    </>
  );
}
