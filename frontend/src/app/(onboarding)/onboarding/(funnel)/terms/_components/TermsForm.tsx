"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  allTermsAgreed,
  EMPTY_AGREEMENT,
  requiredTermsMet,
  setAllTerms,
  type TermsKey,
} from "@/entities/user";
import { TERMS_ITEMS } from "@/shared/config";
import { cn } from "@/shared/lib";
import {
  Checkbox,
  FormErrorNotice,
  PrimaryButton,
  type ActionFailure,
} from "@/shared/ui";
import { agreeTermsAction } from "../_actions";

/**
 * 약관 동의 폼 (3.2).
 *
 * 항목은 `TERMS_ITEMS` 하나에서 온다 — 화면에 리터럴로 다시 적지 않는다.
 * `자세히 보기`(3.2 표 3행)는 **그리지 않았다**: 약관 전문 화면이 TBD 라
 * 목적지가 없다 (`Checkbox` 의 `trailing` 슬롯이 그 자리다).
 */
export function TermsForm() {
  const [agreement, setAgreement] = useState(EMPTY_AGREEMENT);
  const [failure, formAction] = useActionState<ActionFailure | null, FormData>(
    agreeTermsAction,
    null,
  );

  const allAgreed = allTermsAgreed(agreement);
  const toggle = (key: TermsKey) => (checked: boolean) =>
    setAgreement((prev) => ({ ...prev, [key]: checked }));

  return (
    <form action={formAction} className="flex flex-1 flex-col gap-5">
      {/* 켜진 항목만 FormData 에 실린다. 액션은 키의 유무로 읽는다 */}
      {TERMS_ITEMS.filter((item) => agreement[item.key]).map((item) => (
        <input key={item.key} type="hidden" name={item.key} value="on" />
      ))}

      <div
        className={cn(
          "rounded-card border px-4 py-1 transition-colors",
          allAgreed ? "border-accent bg-active" : "border-border bg-surface",
        )}
      >
        <Checkbox
          checked={allAgreed}
          onChange={(checked) => setAgreement(setAllTerms(checked))}
          className="font-bold"
        >
          전체 동의하기
        </Checkbox>
      </div>

      <ul className="flex flex-col gap-1 px-1">
        {TERMS_ITEMS.map((item) => (
          <li key={item.key}>
            <Checkbox checked={agreement[item.key]} onChange={toggle(item.key)}>
              <span className="text-text-sub">
                [{item.required ? "필수" : "선택"}]
              </span>{" "}
              {item.label}
            </Checkbox>
          </li>
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3">
        {failure ? <FormErrorNotice failure={failure} /> : null}
        <SubmitButton enabled={requiredTermsMet(agreement)} />
      </div>
    </form>
  );
}

/**
 * **비활성 라벨이 사유를 말한다** (2.5). 별도 에러 토스트를 띄우지 않는다.
 * 제출 중 라벨은 전환 표시다 — 누른 자리에 붙인다 (P1-5).
 */
function SubmitButton({ enabled }: { enabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <PrimaryButton type="submit" disabled={!enabled || pending}>
      {pending
        ? "동의하는 중..."
        : enabled
          ? "동의하고 계속하기"
          : "필수 약관에 동의해주세요"}
    </PrimaryButton>
  );
}
