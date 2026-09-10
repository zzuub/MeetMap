import type { ApiErrorKind } from "../api/ApiError";

/**
 * 실패 종류별 문구 (11.2).
 *
 * 11.2 는 **네트워크 오류 한 줄만** 정의했다. 그 문구를 8종 전부에 쓰면 403 을 받은
 * 사용자가 자기 와이파이를 확인한다 — 틀린 안내는 안내가 없는 것보다 나쁘다.
 * 그래서 세 갈래로만 나눈다. `Record<ApiErrorKind, …>` 라 **종류가 늘면 컴파일
 * 에러**로 문구를 요구한다.
 *
 * 컴포넌트가 아니라 별도 파일인 것은 **소비자가 둘**이기 때문이다 — 화면 진입의
 * 에러 카드(`ApiErrorScreen`)와 목록의 증분 로딩 실패(`explore-board` 의
 * `LoadMoreError`). 한쪽에 두면 다른 쪽이 그 파일을 통째로 끌어온다.
 */
const NETWORK_COPY = {
  // 11.2 표의 문구 그대로다
  title: "연결이 불안정해요",
  description: "네트워크 상태를 확인한 뒤 다시 시도해주세요",
};

const UNEXPECTED_COPY = {
  title: "정보를 불러오지 못했어요",
  description: "잠시 후 다시 들어와 주세요. 문제가 계속되면 아래 코드로 문의해주세요",
};

export const ERROR_COPY: Record<
  ApiErrorKind,
  { title: string; description: string }
> = {
  NETWORK: NETWORK_COPY,
  TIMEOUT: NETWORK_COPY,

  // 사용자의 연결 문제가 아니다 — 확인하라고 하면 엉뚱한 곳을 보게 된다
  SERVER: {
    title: "잠시 문제가 생겼어요",
    description: "서버 상태를 확인하고 있어요. 잠시 후 다시 시도해주세요",
  },

  // 재시도해도 같은 답이 오는 실패들. `retryable` 이 거짓이라 버튼도 안 뜬다
  UNAUTHORIZED: UNEXPECTED_COPY,
  FORBIDDEN: UNEXPECTED_COPY,
  CLIENT: UNEXPECTED_COPY,
  PARSE: UNEXPECTED_COPY,
  // 목록 조회의 404. 자원 하나를 여는 조회였다면 `errorScreen` 이 없는 페이지로 보낸다
  NOT_FOUND: UNEXPECTED_COPY,
};
