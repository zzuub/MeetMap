import {
  BirthYearRangeText,
  CapacityText,
  EventStatusBadge,
  EventThumbnail,
  PriceText,
  TimeSlotBadge,
} from "@/entities/event";
import { Note, Piece } from "./layout";
import { ALL_SLOTS, ALL_STATUSES, PRICE_BASES } from "./cardShowcase";

/** P1-2 조각 6종. 카드 밖에서도 쓸 수 있게 나눠 둔 단위다 */
export function PieceSection() {
  return (
    <>
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
    </>
  );
}
