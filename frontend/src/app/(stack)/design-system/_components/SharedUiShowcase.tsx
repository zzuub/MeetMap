"use client";

import { useState } from "react";
import { MOOD_TAGS } from "@/shared/config";
import { clampSelection, formatPrice } from "@/shared/lib";
import {
  ActionLink,
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  FormErrorNotice,
  Modal,
  Numeric,
  PrimaryButton,
  SegmentedControl,
  Sheet,
  Skeleton,
  Toggle,
  useToast,
} from "@/shared/ui";
import { Section, Swatch } from "./layout";

const MAX_MOODS = 3;

/** P0-1·P0-3·P0-4 산출물 — 토큰과 `shared/ui` 전 컴포넌트 */
export function SharedUiShowcase() {
  const { showToast } = useToast();

  const [view, setView] = useState<"list" | "map">("list");
  const [moods, setMoods] = useState<string[]>([]);
  const [agreed, setAgreed] = useState(false);
  const [alertOn, setAlertOn] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const toggleMood = (mood: string) => {
    const { next, exceeded } = clampSelection(moods, mood, MAX_MOODS);
    setMoods(next);
    // 한도 초과를 무반응으로 두지 않는다 (16장 개선안)
    if (exceeded) showToast(`최대 ${MAX_MOODS}개까지 선택할 수 있어요`);
  };

  return (
    <>
  <Section title="색상 토큰" note="2.2 — 컴포넌트에 hex 를 하드코딩하지 않는다">
    <div className="grid grid-cols-4 gap-2">
      <Swatch className="bg-primary" label="primary" />
      <Swatch className="bg-secondary" label="secondary" />
      <Swatch className="bg-accent" label="accent" />
      <Swatch className="bg-accent-soft" label="accent-soft" />
      <Swatch className="bg-point" label="point" />
      <Swatch className="bg-success" label="success" />
      <Swatch className="bg-warning" label="warning" />
      <Swatch className="bg-disabled-bg" label="disabled" />
    </div>
    <div className="rounded-card bg-hero p-4 text-[12px] text-surface">
      히어로 예외 — 화면 전체는 밝고, 여기 한 곳만 짙다
    </div>
  </Section>

  <Section title="숫자 표기" note="2.2 — 가격·평점·카운터는 Georgia 세리프">
    <p className="text-[14px] text-text-sub">
      참가비 <Numeric className="text-[18px] font-bold text-text">
        {formatPrice(39000)}
      </Numeric>{" "}
      · 평점 <Numeric>4.6</Numeric> · 후기 <Numeric>38</Numeric>건
    </p>
  </Section>

  <Section title="버튼" note="2.5 — 비활성 버튼의 라벨이 미충족 사유를 말한다">
    <PrimaryButton onClick={() => showToast("찜 목록에 저장했어요")}>
      동의하고 계속하기
    </PrimaryButton>
    <PrimaryButton variant="secondary">비교 담기</PrimaryButton>
    <PrimaryButton disabled>필수 약관에 동의해주세요</PrimaryButton>
  </Section>

  <Section title="칩" note={`6.2 — flex-wrap 으로 배치. 가로 스크롤 금지 (최대 ${MAX_MOODS}개)`}>
    <div className="flex flex-wrap gap-2">
      {MOOD_TAGS.map((mood) => (
        <Chip
          key={mood}
          multiple
          selected={moods.includes(mood)}
          onClick={() => toggleMood(mood)}
        >
          {mood}
        </Chip>
      ))}
    </div>
  </Section>

  <Section title="세그먼트 · 토글 · 체크박스" note="15장 — radiogroup / switch / input">
    <SegmentedControl
      label="보기 방식"
      value={view}
      onChange={setView}
      options={[
        { value: "list", label: "리스트" },
        { value: "map", label: "지도" },
      ]}
    />
    <div className="flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3">
      <span className="text-[14px] text-text">관심지역 신규 소개팅</span>
      <Toggle checked={alertOn} onChange={setAlertOn} label="관심지역 신규 소개팅" />
    </div>
    <Checkbox checked={agreed} onChange={setAgreed}>
      만 19세 이상입니다
    </Checkbox>
  </Section>

  <Section title="시트 · 모달 · 토스트" note="2.5 — 딤 클릭·Esc 닫힘, 포커스 트랩">
    <PrimaryButton variant="secondary" onClick={() => setSheetOpen(true)}>
      바텀 시트 열기
    </PrimaryButton>
    <PrimaryButton variant="secondary" onClick={() => setModalOpen(true)}>
      센터 모달 열기
    </PrimaryButton>
    <PrimaryButton variant="ghost" onClick={() => showToast("2개 담겼어요")}>
      토스트 띄우기
    </PrimaryButton>
  </Section>

  <Section title="스켈레톤" note="11.3 — 목업 미정의, 신규 설계">
    <div className="flex gap-3">
      <Skeleton className="size-[92px] shrink-0" />
      <div className="flex flex-1 flex-col gap-2 py-1">
        <Skeleton className="h-4 w-3/4 rounded-chip" />
        <Skeleton className="h-3 w-1/2 rounded-chip" />
        <Skeleton className="h-3 w-1/3 rounded-chip" />
      </div>
    </div>
  </Section>

  <Section title="빈 상태" note="11.2 — '없다'로 끝내지 않고 다음 행동을 제시한다">
    <div className="rounded-card border border-border bg-surface">
      <EmptyState
        icon="🔍"
        title="조건에 맞는 소개팅이 없어요"
        description="적용한 필터를 하나씩 풀어보면 더 많은 소개팅을 볼 수 있어요"
        // 실제 화면의 액션은 **이동**이라 버튼이 아니라 앵커다 (`ActionLink`)
        action={<ActionLink href="/explore">필터 초기화</ActionLink>}
      />
    </div>
  </Section>

  <Section title="에러 상태" note="11.2 — 오류 코드와 발생 시각을 노출한다">
    <ErrorState
      code="NET_TIMEOUT_504"
      occurredAt={new Date("2026-08-31T14:32:00+09:00")}
      onRetry={() => new Promise((resolve) => setTimeout(resolve, 900))}
      onContactSupport={() => showToast("고객센터 화면은 미설계입니다")}
    />
  </Section>

  <Section
    title="제출 실패 알림"
    note="11.2 — 네 번째 실패 표면. 폼을 지우지 않고 코드·시각을 남긴다 (4.46)"
  >
    <FormErrorNotice
      failure={{
        code: "SRV_500",
        occurredAt: "2026-08-31T14:32:00+09:00",
        title: "잠시 문제가 생겼어요",
        description: "서버 상태를 확인하고 있어요. 잠시 후 다시 시도해주세요",
      }}
    />
  </Section>

      <Sheet
  open={sheetOpen}
  onClose={() => setSheetOpen(false)}
  title="필터"
  footer={
    <PrimaryButton onClick={() => setSheetOpen(false)}>
      8개 결과 보기
    </PrimaryButton>
  }
      >
  <p className="py-2 text-[13px] leading-6 text-text-sub">
    필터는 적용 버튼 없이 실시간 반영된다(6.4). 칩을 고르면 결과 수가 바로 바뀐다.
  </p>
  <div className="flex flex-wrap gap-2 py-2">
    {MOOD_TAGS.map((mood) => (
      <Chip
        key={mood}
        multiple
        selected={moods.includes(mood)}
        onClick={() => toggleMood(mood)}
      >
        {mood}
      </Chip>
    ))}
  </div>
      </Sheet>

      <Modal
  open={modalOpen}
  onClose={() => setModalOpen(false)}
  title="외부 신청 페이지로 이동합니다"
  footer={
    <div className="flex gap-2">
      <PrimaryButton variant="secondary" onClick={() => setModalOpen(false)}>
        취소
      </PrimaryButton>
      <PrimaryButton onClick={() => setModalOpen(false)}>
        확인하고 이동
      </PrimaryButton>
    </div>
  }
      >
  <p>
    신청과 결제는 주최사 페이지에서 진행됩니다. MeetMap은 결제를 대행하지 않습니다.
  </p>
  <p className="mt-3 text-[12px] text-point">
    조건에 맞지 않는 신청은 주최사에 의해 취소될 수 있습니다.
  </p>
  <p className="mt-3 text-[12px] text-text-sub">
    ※ 실제 문구·조건 블록은 Phase 1 · P1-8에서 7.3 사양대로 구현한다. 이 모달은
    레이아웃 확인용이다.
  </p>
      </Modal>
    </>
  );
}
