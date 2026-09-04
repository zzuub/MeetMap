import Link from "next/link";
import type { DistrictShortcut } from "../model/sections";

/** 반경값은 아직 설정과 연동되지 않는다 — **TBD** (5-6) */
const RADIUS_LABEL = "내 주변 3km";

/**
 * 지도 프로모 카드 (5-6 / 5-7).
 *
 * 홈에서 화면을 떠나는 두 경로 중 하나다(나머지는 `전체보기 >`). 칩이 아니라
 * 카드인 것이 중요하다 — 홈에는 필터가 없고, 이동한다는 사실이 형태로 드러나야
 * 기대를 배신하지 않는다 (5.4).
 */
export function MapPromoCard({ shortcuts }: { shortcuts: DistrictShortcut[] }) {
  return (
    <article className="relative flex flex-col gap-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-10 shrink-0 items-center justify-center rounded-card bg-accent-soft text-point"
        >
          <svg viewBox="0 0 24 24" className="size-5">
            <path
              d="M12 21s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="10" r="2.4" fill="none" stroke="currentColor" strokeWidth="1.8" />
          </svg>
        </span>

        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-bold text-text">
            {/* 카드 전체가 클릭 영역이다. 칩은 z-10 으로 이 위에 올라간다 (4.16 과 같은 방식) */}
            <Link href="/explore?view=map" className="after:absolute after:inset-0 after:content-['']">
              지도에서 가까운 소개팅 찾기
            </Link>
          </h2>
          <p className="mt-0.5 text-[12px] text-text-sub">{RADIUS_LABEL}</p>
        </div>
      </div>

      {shortcuts.length > 0 ? (
        // 가로 스크롤을 만들지 않는다 — 칩은 flex-wrap 이다 (6.2)
        <ul className="relative z-10 flex flex-wrap gap-1.5" aria-label="지역 바로가기">
          {shortcuts.map((shortcut) => (
            <li key={shortcut.code}>
              <Link
                href={shortcut.href}
                className="inline-flex items-center rounded-chip bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-text-sub"
              >
                {shortcut.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
