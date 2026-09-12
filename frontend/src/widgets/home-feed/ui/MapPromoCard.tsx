import Link from "next/link";
import { exploreHref } from "@/features/event-filter";
import type { DistrictShortcut } from "../model/sections";

/**
 * 지도 프로모 카드 (5-6 / 5-7).
 *
 * 홈에서 화면을 떠나는 두 경로 중 하나다(나머지는 `전체보기 >`). 칩이 아니라
 * 카드인 것이 중요하다 — 홈에는 필터가 없고, 이동한다는 사실이 형태로 드러나야
 * 기대를 배신하지 않는다 (5.4).
 *
 * ⚠️ **5-6 의 `내 주변 3km` 와 `가까운` 을 쓰지 않는다.** P3-1 로 도착하는 지도가 실제가
 * 됐는데, 지도의 중심은 사용자 위치가 아니라 **결과 범위**이고 반경 축도 없다 — 카드가
 * 3km 를 약속하고 지도가 서울 전역을 그리면 두 화면이 어긋난다 (`decisions.md` 4.56 · 4.71,
 * 사양 갱신 대기는 `spec/14-open-items.md`).
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
            <Link href={MAP_HREF} className="after:absolute after:inset-0 after:content-['']">
              지도에서 소개팅 찾기
            </Link>
          </h2>
          <p className="mt-0.5 text-[12px] text-text-sub">어디서 열리는지 한눈에 보기</p>
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

/** 조건 없는 지도 뷰. 주소는 `exploreHref` 가 만든다 (4.24) */
const MAP_HREF = exploreHref({ view: "map", query: {} });
