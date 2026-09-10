import { AREAS, MAX_PREFERRED_AREAS } from "@/shared/config";
import {
  Chip,
  FormErrorNotice,
  Numeric,
  PrimaryButton,
  type ActionFailure,
} from "@/shared/ui";
import { DENIED_BANNER } from "../model/copy";
import type { DeniedReason } from "../model/types";

/**
 * `denied` — 지역 직접 선택 (4.3).
 *
 * ⚠️ **여기서 고르는 `활동 지역` 은 3.4 의 선호 지역과 같은 값이다.** 지역
 * 마스터도 한도도 같아서 값을 둘로 두면 어긋난다 — 저장도 같은 필드로 간다
 * (`decisions.md` 4.53). 그래서 `AREAS` 8개를 여기 다시 적지 않는다.
 *
 * 한도 초과는 **토스트**로 알린다(16장 개선안) — 폼 검증 실패가 아니라 동작이
 * 거부된 사실이라 2.5 의 토스트 금지에 걸리지 않는다. 토스트를 띄우는 것은
 * 상태를 든 `LocationPermissionGate` 이고 여기는 결과만 그린다.
 */
export function LocationDenied({
  reason,
  areas,
  pending,
  failure,
  formAction,
  onToggleArea,
  onRetry,
}: {
  reason: DeniedReason;
  areas: readonly string[];
  pending: boolean;
  failure: ActionFailure | null;
  formAction: (formData: FormData) => void;
  onToggleArea: (area: string) => void;
  onRetry: () => void;
}) {
  const banner = DENIED_BANNER[reason];

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-6 px-5 pt-10 pb-8">
      <div role="status" className="rounded-card bg-accent-soft px-4 py-3.5">
        <p className="text-[14px] font-bold text-text">{banner.title}</p>
        <p className="mt-1 text-[12px] leading-4 text-text-sub">{banner.body}</p>
      </div>

      <form action={formAction} className="flex min-h-0 flex-1 flex-col gap-6">
        {/* 칩은 버튼이라 값이 폼에 안 실린다. 정규화는 액션의 `normalizeAreas` 가 한다 */}
        <input type="hidden" name="areas" value={areas.join(",")} />

        <div className="flex flex-col gap-2">
          <span className="flex items-baseline justify-between text-[13px] font-bold text-text">
            <span>활동 지역</span>
            <span className="text-[12px] font-normal text-text-sub">
              {areas.length > 0 ? (
                <>
                  <Numeric>{areas.length}</Numeric>개 선택됨
                </>
              ) : (
                `최대 ${MAX_PREFERRED_AREAS}개`
              )}
            </span>
          </span>

          {/* 칩 줄은 가로 스크롤로 만들지 않는다 — `flex-wrap` 이다 (6.2 원칙) */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="활동 지역">
            {AREAS.map((area) => (
              <Chip
                key={area}
                multiple
                selected={areas.includes(area)}
                onClick={() => onToggleArea(area)}
              >
                {area}
              </Chip>
            ))}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-2">
          {failure ? <FormErrorNotice failure={failure} /> : null}

          <PrimaryButton type="submit" disabled={areas.length === 0 || pending}>
            <StartLabel count={areas.length} pending={pending} />
          </PrimaryButton>

          <PrimaryButton variant="ghost" onClick={onRetry}>
            위치 권한 다시 허용하기
          </PrimaryButton>
        </div>
      </form>
    </main>
  );
}

/** 비활성 라벨이 사유를 말한다 (2.5). 별도 에러 토스트를 띄우지 않는다 */
function StartLabel({ count, pending }: { count: number; pending: boolean }) {
  if (pending) return <>저장하는 중...</>;
  if (count === 0) return <>지역을 1개 이상 선택해주세요</>;

  return (
    <>
      <Numeric>{count}</Numeric>개 지역으로 시작하기
    </>
  );
}
