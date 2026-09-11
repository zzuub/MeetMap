import { describe, expect, it } from "vitest";
import { parseSearchParams, searchHref } from "./searchParams";

/**
 * 검색 주소 ↔ 검색어 (11.1 · `decisions.md` 4.66 표 2·7번). 주소가 원본이므로 이 변환이
 * 새로고침·공유·뒤로가기의 계약이다.
 */
describe("parseSearchParams", () => {
  it("검색어를 정규화해 읽는다", () => {
    expect(parseSearchParams({ q: "  성수   루프탑 " })).toEqual({ keyword: "성수 루프탑" });
  });

  it("공백만이거나 없으면 검색어가 없다 — `idle` 이다", () => {
    expect(parseSearchParams({ q: "   " }).keyword).toBeNull();
    expect(parseSearchParams({ q: "" }).keyword).toBeNull();
    expect(parseSearchParams({}).keyword).toBeNull();
  });

  it("같은 키가 둘이면 첫 값만 쓴다", () => {
    expect(parseSearchParams({ q: ["강남", "홍대"] }).keyword).toBe("강남");
  });
});

describe("searchHref", () => {
  it("검색어가 없으면 `/search` 다 — 빈 `q` 를 싣지 않는다", () => {
    expect(searchHref(null)).toBe("/search");
    expect(searchHref("   ")).toBe("/search");
  });

  it("정규화해서 싣는다", () => {
    expect(searchHref("  성수   루프탑 ")).toBe(
      "/search?q=%EC%84%B1%EC%88%98+%EB%A3%A8%ED%94%84%ED%83%91",
    );
  });

  it("왕복한다 — 주소에서 읽은 검색어가 같은 주소를 만든다", () => {
    for (const keyword of ["성수", "Bar & Noy", "7:7 로테이션", "100%", "a=b?c"]) {
      const q = new URL(searchHref(keyword), "http://x").searchParams.get("q");

      expect(parseSearchParams({ q: q ?? undefined }).keyword, keyword).toBe(keyword);
    }
  });
});
