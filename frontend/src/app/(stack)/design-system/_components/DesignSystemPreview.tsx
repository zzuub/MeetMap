"use client";

import { useState, type ReactNode } from "react";
import {
  BirthYearRangeText,
  CapacityText,
  EventCard,
  EventStatusBadge,
  EventThumbnail,
  PriceText,
  TimeSlotBadge,
  type EventCardVariant,
  type EventCardViewer,
  type EventStatus,
  type EventSummary,
  type TimeSlot,
  type ViewerGender,
} from "@/entities/event";
import { MOOD_TAGS } from "@/shared/config";
import { clampSelection, formatPrice } from "@/shared/lib";
import {
  Checkbox,
  Chip,
  EmptyState,
  ErrorState,
  IconButton,
  Modal,
  Numeric,
  PrimaryButton,
  SegmentedControl,
  Sheet,
  Skeleton,
  Toggle,
  useToast,
} from "@/shared/ui";
import { AppHeader } from "@/widgets/app-header";

const MAX_MOODS = 3;

/**
 * 가격·자격 기준 주체. 목 모드의 인증 주체(`MOCK_VIEWER`)는 1996년생 여성이므로
 * 기본값을 거기에 맞춘다 — 목 API 의 `eligibleOnly`·가격 정렬과 같은 기준이다.
 */
const VIEWERS: { code: string; label: string; viewer: EventCardViewer | null }[] = [
  { code: "F", label: "여성 96", viewer: { gender: "F", birthYear: 1996 } },
  { code: "M", label: "남성 94", viewer: { gender: "M", birthYear: 1994 } },
  { code: "GUEST", label: "게스트", viewer: null },
];

/** 목 데이터에 심어 둔 경계값 (P1-0). `entities/event/mock/events.ts` 주석 참조 */
const BOUNDARY_CASES = [
  { id: "evt-004", label: "가격 미확인", note: "malePrice·femalePrice 가 모두 null" },
  { id: "evt-006", label: "이미지 미동의", note: "thumbnailUrl 이 null (7.2 동의 범위)" },
  { id: "evt-007", label: "마감", note: "인기 상위인데 마감된 건" },
  { id: "evt-003", label: "후기 0건", note: "rating 0 · reviewCount 0" },
];

const ALL_VARIANTS: EventCardVariant[] = [
  "feature",
  "ratio",
  "compact",
  "list",
  "sheet",
];

/** P1-2 DoD — 상태 2종 */
const ALL_STATUSES: EventStatus[] = ["신청 가능", "마감"];

/** P1-2 DoD — 시간대 4종. 경계는 시작 시각 기준이다 (6.2) */
const ALL_SLOTS: TimeSlot[] = ["MORNING", "AFTERNOON", "DINNER", "LATE_NIGHT"];

/** P1-2 DoD — 성별 기준 가격. 게스트(`null`)는 병기한다 */
const PRICE_BASES: { label: string; gender: ViewerGender | null }[] = [
  { label: "여성 기준", gender: "F" },
  { label: "남성 기준", gender: "M" },
  { label: "게스트 (병기)", gender: null },
];

interface DesignSystemPreviewProps {
  /**
   * `eventApi.getList` 결과. `app` 레이어는 목 모듈을 직접 import 할 수 없으므로
   * (ESLint 슬라이스 경계 규칙) 서버 컴포넌트가 포트를 통해 받아 넘긴다.
   */
  events: EventSummary[];
}

export function DesignSystemPreview({ events }: DesignSystemPreviewProps) {
  const { showToast } = useToast();

  const [viewerCode, setViewerCode] = useState("F");
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

  const viewer = VIEWERS.find((v) => v.code === viewerCode)?.viewer ?? null;

  /** 찜 버튼 자리를 채우는 대역. 실제 버튼은 `features/event-like` 가 만든다 (P2) */
  const likeSlot = (
    <IconButton
      label="찜하기"
      // 44×44 히트 영역은 IconButton 기본값이다 (15장). 크기를 덮어쓰지 않는다 —
      // cn() 은 Tailwind 충돌을 해결하지 못해 `size-9` 와 `size-11` 이 싸운다
      className="bg-surface/90 backdrop-blur-[2px]"
      onClick={() => showToast("찜 버튼은 features/event-like 의 몫입니다 (P2)")}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
        <path
          d="M12 20s-7.2-4.6-7.2-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.2 2.4C19.2 15.4 12 20 12 20z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </IconButton>
  );

  /** 마커 시트 하단의 신청 버튼. 7.3 외부 이동 모달을 경유해야 한다 (P1-8) */
  const applySlot = (
    <PrimaryButton
      fullWidth={false}
      onClick={() => showToast("외부 이동 모달은 P1-8 에서 붙습니다")}
    >
      신청 페이지로 이동
    </PrimaryButton>
  );

  const card = (event: EventSummary, variant: EventCardVariant) => (
    <EventCard
      key={`${variant}-${event.id}`}
      event={event}
      variant={variant}
      viewer={viewer}
      action={variant === "sheet" ? applySlot : likeSlot}
    />
  );

  const pick = (id: string) => events.find((event) => event.id === id);
  const sample = (index: number) => events[index % Math.max(events.length, 1)];

  return (
    <>
      <AppHeader title="디자인 시스템" backHref="/" />

      <div className="flex flex-col gap-8 px-5 py-6">
        <Section
          title="소개팅 카드 — variant 5종"
          note="14.1 / 5.3 / 6.5 / 6.6 — 한 컴포넌트에 variant prop 으로 통합"
        >
          <SegmentedControl
            label="가격·자격 기준"
            value={viewerCode}
            onChange={setViewerCode}
            options={VIEWERS.map((v) => ({ value: v.code, label: v.label }))}
          />
          <p className="text-[12px] leading-5 text-text-sub">
            가격은 <b>사용자 성별 기준값만</b> 노출한다. 게스트는 어느 쪽이 자기 값인지
            알 수 없으므로 남·여를 병기한다. <code>ratio</code> 의 자격 배지도 기준을
            바꾸면 같이 바뀐다.
          </p>

          <VariantBlock
            name="feature"
            spec="홈 가로 스크롤 · 196px / 썸네일 118px (5.3 섹션 A)"
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
            spec="홈 `새로 등록된` · 찜 목록 · 썸네일 64px (5.3 섹션 C)"
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
        </Section>

        <Section
          title="카드 조각"
          note="P1-2 — 배지 · 정원 · 가격. 카드 밖에서도 쓸 수 있게 나눠 둔 단위다"
        >
          <Piece name="EventStatusBadge" spec="모집 상태 2종 (6.5 / 7.1)">
            <div className="flex flex-wrap items-center gap-2">
              {ALL_STATUSES.map((status) => (
                <EventStatusBadge key={status} status={status} />
              ))}
            </div>
            <Note>
              선착순이 아니라 주최사 심사 선발이라 <code>마감임박</code>·
              <code>잔여 N석</code> 이 존재하지 않는다. 색만으로 구분하지 않도록 라벨을
              그대로 노출한다.
            </Note>
          </Piece>

          <Piece name="TimeSlotBadge" spec="시간대 4종 · 시작 시각 기준 (6.2)">
            <div className="flex flex-wrap items-center gap-2">
              {ALL_SLOTS.map((slot) => (
                <TimeSlotBadge key={slot} slot={slot} />
              ))}
            </div>
            <Note>
              오전 <code>~12:00</code> / 오후 <code>12:00~17:00</code> / 디너{" "}
              <code>17:00~21:00</code> / 심야 <code>21:00~</code>. 삭제한 카테고리 축을
              이 축이 대신한다.
            </Note>
          </Piece>

          <Piece name="CapacityText" spec="모집 정원 `남 N · 여 N` (5.3 / 6.5 / 6.6 / 7.1)">
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-text-sub">
              <CapacityText maleCapacity={7} femaleCapacity={7} />
              <CapacityText maleCapacity={15} femaleCapacity={15} />
              <CapacityText maleCapacity={10} femaleCapacity={4} />
            </div>
            <Note>
              <b className="text-text">성비 게이지를 만들지 않는다.</b> 남녀 정원이 고정
              동수라 성비가 항상 50% 이고, 게이지는 매번 절반이 찬 그림만 그린다. 세 번째는
              비대칭 예외(<code>10:4</code>)가 들어와도 표기가 답을 내는지 본 것이다.
            </Note>
          </Piece>

          <Piece name="PriceText" spec="성별 기준 참가비 (2.2 / 5.3 / 6.5)">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[340px] text-left text-[13px]">
                <thead className="text-[11px] text-text-sub">
                  <tr>
                    <th className="pb-1 font-medium">기준</th>
                    <th className="pb-1 font-medium">남 45,000 / 여 35,000</th>
                    <th className="pb-1 font-medium">둘 다 null</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICE_BASES.map((base) => (
                    <tr key={base.label} className="border-t border-border">
                      <td className="py-2 text-[12px] text-text-sub">{base.label}</td>
                      <td className="py-2">
                        <PriceText
                          malePrice={45000}
                          femalePrice={35000}
                          gender={base.gender}
                          className="font-bold text-text"
                        />
                      </td>
                      <td className="py-2">
                        <PriceText
                          malePrice={null}
                          femalePrice={null}
                          gender={base.gender}
                          className="font-bold text-text"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Note>
              로그인 사용자에게는 <b className="text-text">자기 성별 기준값만</b> 준다.
              게스트는 어느 쪽이 자기 값인지 알 수 없어 병기한다. 미확인 건은{" "}
              <code>링크 확인</code> — <code>0원</code>·<code>무료</code> 로 읽힐 문구를
              쓰지 않고, 가격 상한 필터도 같은 이유로 이 건을 제외한다.
            </Note>
          </Piece>

          <Piece name="BirthYearRangeText" spec="참가 가능 출생연도 (6.5 / 6.6 / 7.1 / 7.3)">
            <div className="flex flex-wrap items-center gap-4 text-[13px] text-text-sub">
              <BirthYearRangeText birthYearFrom={1990} birthYearTo={1996} />
              <BirthYearRangeText birthYearFrom={1997} birthYearTo={2003} />
              <BirthYearRangeText birthYearFrom={1995} birthYearTo={1995} />
            </div>
            <Note>
              나이가 아니라 <b className="text-text">출생연도</b>다. 나이로 환산하면 생일
              전후로 답이 달라져 7.3 조건 확인 블록에서 분쟁의 소지가 된다. 세기를 넘는
              범위(<code>97~03</code>)에서도 두 자리를 지킨다.
            </Note>
          </Piece>

          <Piece
            name="EventThumbnail"
            spec="이미지가 없을 때의 대체 표시 (7.2 동의 범위)"
          >
            <div className="flex flex-wrap items-end gap-3">
              {[
                { size: "h-[118px] w-[196px]", label: "애프터눈", caption: "196px" },
                { size: "size-[92px]", label: "로테이션서울", caption: "92px" },
                { size: "size-[88px]", label: "미팅라운지", caption: "88px" },
                { size: "size-16", label: "테이블포텐", caption: "64px" },
              ].map((box) => (
                <div key={box.caption} className="flex flex-col items-center gap-1">
                  <EventThumbnail
                    src={null}
                    label={box.label}
                    sizes="196px"
                    className={`${box.size} rounded-[14px]`}
                  />
                  <span className="text-[10px] text-text-sub">{box.caption}</span>
                </div>
              ))}
            </div>
            <Note>
              <b className="text-text">이미지가 없는 것은 오류가 아니다.</b> 주최사 등록은
              동의 기반이고 동의 범위가 <code>정보 등록</code> / <code>이미지 사용</code> /{" "}
              <code>참석자 리스트 표시</code> 로 나뉜다. 정보만 허락한 주최사의 소개팅을
              목록에서 빼면 컨택이 덜 진행된 주최사가 통째로 사라진다. 이름으로 톤을 정해
              여러 장이 이어져도 서로 구분된다. 폭이 좁으면(92px 이하) 이름을 숨긴다.
            </Note>
          </Piece>
        </Section>

        <Section
          title="카드 경계값"
          note="P1-0 목 데이터에 심어 둔 경계가 5종에서 각각 어떻게 떨어지는지"
        >
          <ul
            className={[
              "flex list-disc flex-col gap-1.5 rounded-card border border-border",
              "bg-surface p-4 pl-8 text-[12px] leading-5 text-text-sub",
              // JSX 는 태그와 줄바꿈 사이의 공백을 지운다. 코드 조각에 여백을 직접 준다
              "[&_code]:mx-0.5 [&_code]:rounded-[4px] [&_code]:bg-accent-soft [&_code]:px-1",
            ].join(" ")}
          >
            <li>
              <b className="text-text">가격 미확인</b> — 5종 모두 <code>링크 확인</code>.
              <code>0원</code>·<code>무료</code> 로 읽힐 문구를 쓰지 않는다.
            </li>
            <li>
              <b className="text-text">이미지 미동의</b> — 5종 모두 주최사 이름이 든 대체
              표시. 폭이 좁은 <code>compact</code>·<code>list</code>·<code>sheet</code> 는
              이름을 숨기고 마크만 남긴다. 이미지가 없다고 소개팅을 숨기지 않는다.
            </li>
            <li>
              <b className="text-text">마감</b> — 상태 배지가 있는 건{" "}
              <code>feature</code>·<code>list</code>·<code>sheet</code> 뿐이다.
              <code>ratio</code>·<code>compact</code> 는 5.3 표시 항목에 모집 상태가
              없어서 <b className="text-warning">마감된 소개팅이 신청 가능해 보인다.</b>{" "}
              표시 항목을 늘릴지는 미결 — 기능정의서를 고쳐야 하는 사안이다.
            </li>
            <li>
              <b className="text-text">후기 0건</b> — 5종 어디에도 드러나지 않는다.
              5.3·6.5·7.1 어느 표시 항목에도 평점이 없다. 후기는 비교함(8장)과 후기
              목록(10.4)의 축이다.
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
        </Section>

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
              action={<PrimaryButton variant="secondary">필터 초기화</PrimaryButton>}
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
      </div>

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

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-[15px] font-bold text-primary">{title}</h2>
        <p className="text-[12px] text-text-sub">{note}</p>
      </div>
      {children}
    </section>
  );
}

/** 조각 하나. 이름 + 근거 + 상태 나열 + 왜 그렇게 만들었는지 */
function Piece({
  name,
  spec,
  children,
}: {
  name: string;
  spec: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4">
      <p className="text-[12px] text-text-sub">
        <code className="rounded-chip bg-accent-soft px-2 py-0.5 font-bold text-text">
          {name}
        </code>{" "}
        {spec}
      </p>
      {children}
    </div>
  );
}

/** 조각 밑에 붙는 근거 문단. 코드 조각에 여백을 직접 준다 (JSX 가 공백을 지운다) */
function Note({ children }: { children: ReactNode }) {
  return (
    <p
      className={[
        "text-[11.5px] leading-5 text-text-sub",
        "[&_code]:mx-0.5 [&_code]:rounded-[4px] [&_code]:bg-accent-soft [&_code]:px-1",
      ].join(" ")}
    >
      {children}
    </p>
  );
}

function VariantBlock({
  name,
  spec,
  children,
}: {
  name: string;
  spec: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12px] text-text-sub">
        <code className="rounded-chip bg-accent-soft px-2 py-0.5 font-bold text-text">
          {name}
        </code>{" "}
        {spec}
      </p>
      {children}
    </div>
  );
}

function Swatch({ className, label }: { className: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-12 w-full rounded-[10px] border border-border ${className}`} />
      <span className="text-[10px] text-text-sub">{label}</span>
    </div>
  );
}
