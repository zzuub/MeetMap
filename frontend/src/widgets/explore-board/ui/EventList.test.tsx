import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ApiError, type ApiErrorKind } from "@/shared/api";
import { formatErrorTimestamp } from "@/shared/lib";
import { LoadMoreError } from "./EventList";

/**
 * **증분 로딩 실패도 11.2 를 지킨다** (`decisions.md` 4.40).
 *
 * 이 화면의 실패 표면은 둘인데, 리뷰 전까지 여기는 `catch { setState("failed") }` 로
 * `ApiError` 를 통째로 버리고 있었다 — 버튼 라벨만 바뀌고 **오류 코드도 발생 시각도
 * 나오지 않았다.** 8종 표(`errorScreen.test.ts`)는 화면 진입만 잠그므로 그 보호망
 * 밖이었다.
 *
 * 이 실패는 클릭 뒤 비동기로만 도달해서 `EventList` 를 통째로 정적 렌더해서는
 * 만들어낼 수 없다. 그래서 실패 블록만 떼어 직접 렌더한다 (4.39 와 같은 수법).
 */
function markup(kind: ApiErrorKind, code: string) {
  const error = new ApiError({ kind, code, message: "테스트" });
  // 발생 시각은 생성 시각이라 고정할 수 없다 — 표기만 비교한다
  return {
    html: renderToStaticMarkup(<LoadMoreError error={error} onRetry={() => {}} />),
    stamp: formatErrorTimestamp(error.occurredAt),
  };
}

describe("더 보기 실패 (11.2)", () => {
  it("오류 코드와 발생 시각을 노출한다", () => {
    const { html, stamp } = markup("SERVER", "SRV_503");

    expect(html).toContain("SRV_503");
    expect(html).toContain(stamp);
  });

  it("재시도 가능한 실패에는 `다시 시도` 가 있다", () => {
    expect(markup("SERVER", "SRV_503").html).toContain("다시 시도");
  });

  it("재시도해도 같은 답이 오는 실패에는 버튼을 그리지 않는다", () => {
    const { html } = markup("FORBIDDEN", "PERM_403");

    expect(html).toContain("PERM_403");
    // 문구에 `다시 시도해주세요` 가 섞일 수 있으니 버튼의 유무로 본다
    expect(html).not.toContain("<button");
  });

  it("발생 시각을 빠뜨리지 않는다 — 코드만으로는 CS 문의를 특정할 수 없다", () => {
    const { html, stamp } = markup("NETWORK", "NET_UNREACHABLE");

    expect(html).toContain(`NET_UNREACHABLE · ${stamp}`);
  });
});
