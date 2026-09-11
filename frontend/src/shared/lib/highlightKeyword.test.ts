import { describe, expect, it } from "vitest";
import { highlightKeyword } from "./highlightKeyword";

/**
 * 검색 결과 제목의 하이라이트 분할 (11.1). P0 에 만들어 두고 검색(P2-9)이 처음 쓴다.
 * 조각이 **원문 그대로**여야 한다 — HTML 을 만들지 않으므로 화면이 `<mark>` 로만 감싼다.
 */
describe("highlightKeyword", () => {
  it("대소문자를 무시하고 찾되 원문 표기를 남긴다", () => {
    expect(highlightKeyword("Bar Noy bar", "BAR")).toEqual([
      { text: "Bar", matched: true },
      { text: " Noy ", matched: false },
      { text: "bar", matched: true },
    ]);
  });

  it("검색어 앞뒤 공백은 떼고 찾는다", () => {
    expect(highlightKeyword("성수 루프탑", "  루프탑 ")).toEqual([
      { text: "성수 ", matched: false },
      { text: "루프탑", matched: true },
    ]);
  });

  it("검색어가 비었거나 못 찾으면 통째로 한 조각이다", () => {
    expect(highlightKeyword("성수", "   ")).toEqual([{ text: "성수", matched: false }]);
    expect(highlightKeyword("성수", "강남")).toEqual([{ text: "성수", matched: false }]);
  });

  it("HTML 을 만들지 않는다 — 제목에 든 태그 글자도 원문 조각이다", () => {
    expect(highlightKeyword("<b>로테이션</b>", "로테이션")).toEqual([
      { text: "<b>", matched: false },
      { text: "로테이션", matched: true },
      { text: "</b>", matched: false },
    ]);
  });
});
