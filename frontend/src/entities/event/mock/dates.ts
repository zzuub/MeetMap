import { formatEventDate, formatEventTime } from "@/shared/lib";
import { weekRangeKst } from "../model/derive";

/**
 * 목 데이터의 날짜를 **이번 주 월요일 기준 상대값**으로 만든다.
 *
 * 전에는 절대 날짜(`2026-09-04T19:30:00+09:00`)를 박아 두고 "과거로 밀리면
 * 갱신한다"고 적어 뒀는데, 갱신하는 사람이 없어 2026-09-07 에 주가 넘어가면서
 * `when=THIS_WEEK` 집합이 통째로 갈아엎어졌다 — 목 API 테스트 1건이 실제로
 * 깨졌다. 날짜를 밀어 봐야 **다음 주에 같은 방식으로 또 깨진다.**
 *
 * 기준을 `weekRangeKst` 로 잡는 것이 핵심이다. `isThisWeek` 가 보는 것과 **같은
 * 함수**라, "이번 주 5건 · 그 이후 3건" 같은 경계값 배치가 우연이 아니라
 * **구조로 보장된다.**
 *
 * 주 단위 기준이라 값은 **한 주 동안 고정**이다. `MOCK_EVENTS` 는 모듈 로드 때
 * 한 번 계산되므로 한 프로세스 안에서는 불변이고, 목록 조회와 패싯 스캔이 같은
 * 스냅샷을 본다는 전제(`decisions.md` 4.28)도 그대로다.
 */

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 이번 주 월요일 00:00(KST)에서 `days` 일 뒤 `time`(`"19:30"`)의 ISO 문자열.
 *
 * 음수 `days` 는 지난주로 간다 — `createdAt` 이 그렇다. **등록일은 전부 이번 주
 * 월요일 이전**이라 어느 요일에 돌려도 미래가 되지 않는다.
 *
 * 실행 환경의 타임존에 기대지 않는다(`weekRangeKst` 와 같은 이유). +9h 밀어
 * UTC 게터로 KST 달력값을 읽고, 오프셋을 문자열에 그대로 박는다.
 */
export function kstFromThisMonday(days: number, time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  const at =
    weekRangeKst(new Date()).start +
    days * DAY_MS +
    hour * 60 * 60 * 1000 +
    minute * 60 * 1000;

  const kst = new Date(at + KST_OFFSET_MS);

  return (
    `${kst.getUTCFullYear()}-${pad(kst.getUTCMonth() + 1)}-${pad(kst.getUTCDate())}` +
    `T${pad(kst.getUTCHours())}:${pad(kst.getUTCMinutes())}:00+09:00`
  );
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * 한 회차의 **일정 3필드를 함께** 만든다 — `date` 와 표시 문자열이 갈라지지 않게.
 *
 * `date` 만 상대값으로 바꾸고 `dateLabel` 을 리터럴로 두었다가 PR #27 리뷰에
 * 걸렸다. 계산된 날짜는 매주 움직이는데 라벨은 `"9/4(금)"` 에 박혀 있어 **바꾼 그
 * 주부터 이미 일주일씩 어긋나 있었다** — 카드가 `9/5(토)` 를 그리는 동안 `date` 는
 * 9/12 였다. 요일 글자만 우연히 맞아(월+4 는 언제나 금요일) 눈에 안 띄었다.
 *
 * 그래서 셋을 **한 함수가 같은 순간에서 만든다.** 리터럴을 다시 적을 자리가 없으면
 * 어긋날 수도 없다 (`decisions.md` 4.31).
 *
 * ⚠️ **`timeSlot` 은 일부러 여기서 안 만든다.** 그것까지 파생시키면 불변식 테스트
 * (`timeSlot 이 개최 시각과 어긋나지 않는다`)가 자기가 만든 값을 자기가 검사하는
 * 순환이 된다 — 같은 이유로 이 함수가 만드는 라벨에는 대응하는 테스트를 두지
 * 않는다. 검사할 독립적인 값이 없다.
 */
export function schedule(days: number, time: string): {
  date: string;
  dateLabel: string;
  timeLabel: string;
} {
  const date = kstFromThisMonday(days, time);

  return { date, dateLabel: formatEventDate(date), timeLabel: formatEventTime(date) };
}
