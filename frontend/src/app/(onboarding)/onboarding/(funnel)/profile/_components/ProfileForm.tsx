"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  BIRTH_YEARS,
  isProfileReady,
  normalizeNickname,
  type ProfileGender,
} from "@/entities/user";
import {
  AREAS,
  BIRTH_YEAR_DEFAULT,
  MAX_PREFERRED_AREAS,
  NICKNAME_MAX_LENGTH,
} from "@/shared/config";
import { clampSelection, cn } from "@/shared/lib";
import {
  Chip,
  FormErrorNotice,
  Numeric,
  PrimaryButton,
  useToast,
  type ActionFailure,
} from "@/shared/ui";
import { saveProfileAction } from "../_actions";

const GENDERS: readonly { code: ProfileGender; label: string }[] = [
  { code: "F", label: "여성" },
  { code: "M", label: "남성" },
];

/**
 * 프로필 설정 폼 (3.4).
 *
 * **관심 카테고리 입력은 없다** — 로테이션 소개팅은 상품 종류가 하나라 취미
 * 카테고리가 성립하지 않는다. 개인화의 축은 출생연도 + 성별이고 둘 다 여기서 받는다.
 *
 * 지역 한도 초과는 **토스트로 알린다** (16장 개선안). 무반응으로 두면 사용자가
 * 원인을 알 수 없다 — `clampSelection` 이 "무시했다"는 사실을 돌려주는 이유다.
 * 폼 검증 실패가 아니라 **동작이 거부된 사실**이라 2.5 의 토스트 금지에 걸리지 않는다.
 */
export function ProfileForm() {
  const { showToast } = useToast();
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [areas, setAreas] = useState<string[]>([]);
  const [failure, formAction] = useActionState<ActionFailure | null, FormData>(
    saveProfileAction,
    null,
  );

  const toggleArea = (area: string) => {
    const { next, exceeded } = clampSelection(areas, area, MAX_PREFERRED_AREAS);
    if (exceeded) {
      showToast(`최대 ${MAX_PREFERRED_AREAS}개까지 선택할 수 있어요`);
      return;
    }
    setAreas(next);
  };

  return (
    <form action={formAction} className="flex min-h-0 flex-1 flex-col">
      {/* 칩은 버튼이라 값이 폼에 안 실린다. 정규화는 액션의 `normalizeAreas` 가 한다 */}
      <input type="hidden" name="areas" value={areas.join(",")} />
      {gender ? <input type="hidden" name="gender" value={gender} /> : null}

      {/* 시트 최대 높이 78vh + 내부 스크롤 (3.4) */}
      <div className="flex max-h-[78vh] flex-col gap-6 overflow-y-auto pb-6">
        <Field label="닉네임" required>
          <div className="flex items-center gap-2 rounded-button border border-border bg-surface px-3.5">
            <input
              name="nickname"
              value={nickname}
              onChange={(event) => setNickname(normalizeNickname(event.target.value))}
              maxLength={NICKNAME_MAX_LENGTH}
              aria-label="닉네임"
              placeholder="소개팅에서 보일 이름"
              className="min-h-12 flex-1 bg-transparent text-[15px] text-text outline-none placeholder:text-text-sub/60"
            />
            <span className="shrink-0 text-[12px] text-text-sub">
              <Numeric>
                {nickname.length}/{NICKNAME_MAX_LENGTH}
              </Numeric>
              자
            </span>
          </div>
        </Field>

        <Field label="출생연도">
          <select
            name="birthYear"
            aria-label="출생연도"
            defaultValue={BIRTH_YEAR_DEFAULT}
            className="min-h-12 w-full rounded-button border border-border bg-surface px-3.5 text-[15px] text-text"
          >
            {BIRTH_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
        </Field>

        <Field label="성별" required>
          <div className="flex gap-2" role="group" aria-label="성별">
            {GENDERS.map((option) => (
              <button
                key={option.code}
                type="button"
                aria-pressed={gender === option.code}
                onClick={() => setGender(option.code)}
                className={cn(
                  "min-h-12 flex-1 rounded-button border text-[15px] font-semibold transition-colors",
                  gender === option.code
                    ? "border-accent bg-active text-text"
                    : "border-border bg-surface text-text-sub",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </Field>

        <Field
          label="선호 지역"
          hint={
            areas.length > 0 ? (
              <>
                <Numeric>{areas.length}</Numeric>개 선택됨
              </>
            ) : (
              `최대 ${MAX_PREFERRED_AREAS}개`
            )
          }
        >
          {/* 칩 줄은 가로 스크롤로 만들지 않는다 — `flex-wrap` 이다 (6.2 원칙) */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="선호 지역">
            {AREAS.map((area) => (
              <Chip
                key={area}
                multiple
                selected={areas.includes(area)}
                onClick={() => toggleArea(area)}
              >
                {area}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-2">
        {failure ? <FormErrorNotice failure={failure} /> : null}
        <SubmitButton enabled={isProfileReady({ nickname, gender })} />
      </div>
    </form>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="flex items-baseline justify-between text-[13px] font-bold text-text">
        <span>
          {label}
          {required ? <span className="text-point"> *</span> : null}
        </span>
        {hint ? <span className="text-[12px] font-normal text-text-sub">{hint}</span> : null}
      </span>
      {children}
    </div>
  );
}

/** 비활성 라벨이 사유를 말한다 (2.5). 제출 중 라벨은 누른 자리의 전환 표시다 */
function SubmitButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <PrimaryButton type="submit" disabled={!enabled || pending}>
      {pending
        ? "저장하는 중..."
        : enabled
          ? "완료하고 시작하기"
          : "닉네임과 성별을 입력해주세요"}
    </PrimaryButton>
  );
}
