import { describe, expect, it } from "vitest";
import {
  parseStoredKeywords,
  withRecentKeyword,
  withoutRecentKeyword,
} from "./recentKeywords";

/**
 * 최근 검색어 목록의 규칙 (11.1 · `decisions.md` 4.69). 상한 6 은 **리터럴로** 잠근다 —
 * 상수끼리 비교하면 값을 바꿔도 통과한다 (4.52).
 */
describe("withRecentKeyword", () => {
  it("맨 앞에 넣는다", () => {
    expect(withRecentKeyword(["강남", "홍대"], "성수")).toEqual(["성수", "강남", "홍대"]);
  });

  it("이미 있으면 맨 앞으로 옮긴다 — 둘이 되지 않는다", () => {
    expect(withRecentKeyword(["강남", "성수", "홍대"], "성수")).toEqual(["성수", "강남", "홍대"]);
  });

  it("대소문자·공백만 다르면 같은 검색어이고 새 표기가 남는다", () => {
    expect(withRecentKeyword(["bar noy", "강남"], "  Bar  Noy ")).toEqual(["Bar Noy", "강남"]);
  });

  it("6개까지 — 가장 오래된 것이 빠진다", () => {
    const six = ["6", "5", "4", "3", "2", "1"];

    expect(withRecentKeyword(six, "7")).toEqual(["7", "6", "5", "4", "3", "2"]);
  });

  it("빈 검색어는 남기지 않는다", () => {
    expect(withRecentKeyword(["강남"], "   ")).toEqual(["강남"]);
  });

  it("입력을 바꾸지 않는다", () => {
    const input = Object.freeze(["강남"]);

    withRecentKeyword(input, "성수");
    expect(input).toEqual(["강남"]);
  });
});

describe("withoutRecentKeyword", () => {
  it("그 검색어만 뺀다 — 대소문자는 무시한다", () => {
    expect(withoutRecentKeyword(["Bar Noy", "강남"], "bar noy")).toEqual(["강남"]);
  });
});

describe("parseStoredKeywords", () => {
  it("저장된 것이 없으면 빈 목록이다", () => {
    expect(parseStoredKeywords(null)).toEqual([]);
  });

  it("JSON 이 아니거나 배열이 아니면 빈 목록이다 — 던지지 않는다", () => {
    expect(parseStoredKeywords("{")).toEqual([]);
    expect(parseStoredKeywords('{"a":1}')).toEqual([]);
    expect(parseStoredKeywords('"성수"')).toEqual([]);
  });

  it("문자열이 아닌 것·빈 것은 버리고, 정규화하고, 겹치면 앞(최근)의 것을 남긴다", () => {
    const raw = JSON.stringify(["  성수 ", 3, null, "", "성수", "강남", "BAR", "bar"]);

    expect(parseStoredKeywords(raw)).toEqual(["성수", "강남", "BAR"]);
  });

  it("6개를 넘겨 저장돼 있으면 앞(최근)에서 자른다 — 옛 상한 8 로 저장된 값도", () => {
    const eight = ["0", "1", "2", "3", "4", "5", "6", "7"];

    expect(parseStoredKeywords(JSON.stringify(eight))).toEqual(["0", "1", "2", "3", "4", "5"]);
  });
});
