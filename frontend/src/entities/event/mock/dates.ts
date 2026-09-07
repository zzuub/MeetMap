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
