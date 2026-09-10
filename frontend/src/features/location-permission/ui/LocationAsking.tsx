import { FormErrorNotice, PrimaryButton, type ActionFailure } from "@/shared/ui";
import { PRIVACY_NOTICE } from "../model/copy";

/**
 * `asking` — 권한 요청 (4.1).
 *
 * ⚠️ **혜택 문구가 4.1 과 다르다.** 4.1 은 `① 거리순 정렬 ② 지도 중심 자동 설정`
 * 인데 둘 다 아직 없는 기능이다 — 권한을 허용해도 정렬 목록(`SORT_OPTIONS`)에
 * 거리순이 없고 지도는 P3-1 이다. 지금 참인 것만 적고, 되돌릴 문구는
 * `MAP_AXIS_PHRASES` 가 들고 있다 (`decisions.md` 4.56).
 *
 * 훅이 없다 — 상태는 전부 `LocationPermissionGate` 가 들고 여기는 props 만 받는다.
 * 그래야 jsdom 없이 `renderToStaticMarkup` 으로 문구를 검증할 수 있다 (4.10·4.39).
 */
export function LocationAsking({
  supported,
  pending,
  failure,
  onAllow,
  onChooseArea,
}: {
  /** 브라우저가 Geolocation 을 지원하는가. 비활성 라벨이 사유를 말한다 (2.5) */
  supported: boolean;
  pending: boolean;
  failure: ActionFailure | null;
  onAllow: () => void;
  onChooseArea: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col justify-between gap-8 px-5 pt-14 pb-10">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-[22px] leading-7 font-bold text-primary">
            지금 있는 곳 근처부터
            <br />
            보여드릴까요
          </h1>
          <p className="text-[13px] leading-5 text-text-sub">
            한 번만 허용하면 지역을 매번 고르지 않아도 돼요
          </p>
        </div>

        <ul className="flex flex-col gap-3">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.title}
              className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-4"
            >
              <span
                aria-hidden
                className="flex size-11 shrink-0 items-center justify-center rounded-card bg-accent-soft text-xl"
              >
                {benefit.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-bold text-text">{benefit.title}</p>
                <p className="text-[12px] text-text-sub">{benefit.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        {/* 4.1 의 고정 문구. 이 화면이 무엇을 저장하지 않는지 여기서 약속한다 */}
        <p className="text-center text-[12px] leading-4 text-text-sub">
          {PRIVACY_NOTICE}
        </p>

        {failure ? <FormErrorNotice failure={failure} /> : null}

        <PrimaryButton onClick={onAllow} disabled={!supported || pending}>
          {allowLabel({ supported, pending })}
        </PrimaryButton>

        <PrimaryButton variant="ghost" onClick={onChooseArea}>
          지역 직접 선택할게요
        </PrimaryButton>
      </div>
    </main>
  );
}

const BENEFITS = [
  { icon: "📍", title: "내 주변 소개팅을 먼저", body: "가까운 지역부터 보여드려요" },
  { icon: "⚡", title: "지역을 고를 필요 없이", body: "홈을 열면 바로 맞춰져 있어요" },
] as const;

/** 비활성 라벨이 사유를 말한다 (2.5). 진행 중 라벨은 누른 자리의 전환 표시다 */
function allowLabel({ supported, pending }: { supported: boolean; pending: boolean }) {
  if (!supported) return "이 브라우저는 위치를 지원하지 않아요";
  return pending ? "위치를 확인하는 중..." : "위치 정보 허용하기";
}
