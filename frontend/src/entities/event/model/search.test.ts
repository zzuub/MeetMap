import { describe, expect, it } from "vitest";
import { isSameSearchKeyword, matchesSearchKeyword, normalizeSearchKeyword } from "./search";

/**
 * 검색어 규칙 (11.1 · `decisions.md` 4.66 표 7·8번).
 *
 * 목의 판정 · 주소 파싱 · 최근 검색어가 전부 이 함수들을 보므로 여기서 한 번 잠그면 세
 * 자리가 같이 잠긴다. 목 데이터에는 로마자가 없어 대소문자는 **합성 입력**으로 본다.
 */
describe("normalizeSearchKeyword", () => {
  it("앞뒤 공백을 떼고 연속 공백을 한 칸으로 만든다", () => {
    expect(normalizeSearchKeyword("  성수   루프탑  ")).toBe("성수 루프탑");
  });

  it("탭·줄바꿈·전각 공백도 공백이다", () => {
    const ideographicSpace = String.fromCharCode(0x3000);
    expect(normalizeSearchKeyword(`성수\t\n루프탑${ideographicSpace}`)).toBe("성수 루프탑");
  });

  it("공백만 있으면 검색어가 없는 것이다 — `idle` 이지 `empty` 가 아니다", () => {
    expect(normalizeSearchKeyword("")).toBeNull();
    expect(normalizeSearchKeyword("   ")).toBeNull();
  });

  it("대소문자는 바꾸지 않는다 — 화면에는 친 표기가 남는다", () => {
    expect(normalizeSearchKeyword("Bar Noy")).toBe("Bar Noy");
  });
});

describe("matchesSearchKeyword", () => {
  const event = {
    title: "Rooftop 로테이션 소개팅 7:7",
    area: "성수·건대",
    provider: { id: "prv-t", name: "테스트주최" },
  };

  it("소개팅명 · 지역 · 주최사명 어느 쪽에 걸려도 걸린다", () => {
    expect(matchesSearchKeyword(event, "로테이션")).toBe(true);
    expect(matchesSearchKeyword(event, "건대")).toBe(true);
    expect(matchesSearchKeyword(event, "테스트")).toBe(true);
  });

  it("대소문자를 무시한다", () => {
    expect(matchesSearchKeyword(event, "ROOFTOP")).toBe(true);
    expect(matchesSearchKeyword(event, "rooftop")).toBe(true);
  });

  it("필드 경계를 넘어 걸리지 않는다 — 제목 끝과 지역 앞을 이은 글자", () => {
    // 이어 붙인 문자열(`… 7:7 성수·건대`)에서 찾는 구현이면 여기서 걸린다
    expect(matchesSearchKeyword(event, "7:7 성수")).toBe(false);
  });

  it("검색어를 정규화해서 본다 — 공백이 늘어도 같은 결과다", () => {
    expect(matchesSearchKeyword(event, "  로테이션   소개팅 ")).toBe(true);
  });

  it("빈 검색어는 아무것에도 걸리지 않는다", () => {
    expect(matchesSearchKeyword(event, "   ")).toBe(false);
  });
});

describe("isSameSearchKeyword", () => {
  it("대소문자·공백만 다르면 같은 검색어다", () => {
    expect(isSameSearchKeyword("Bar  Noy", " bar noy")).toBe(true);
  });

  it("글자가 다르면 다른 검색어다", () => {
    expect(isSameSearchKeyword("성수", "성수동")).toBe(false);
  });
});
