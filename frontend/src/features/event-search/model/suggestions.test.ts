import { describe, expect, it } from "vitest";
import type { TrendingSnapshot } from "@/entities/search";
import { isTrending, suggestKeywords } from "./suggestions";

/** 결과 없음의 추천 검색어 (11.1 · 11.2 · `decisions.md` 4.68) */
const trending = (...keywords: string[]): TrendingSnapshot => ({
  baseAt: "2026-09-11T01:00:00Z",
  keywords: keywords.map((keyword) => ({ keyword, previousRank: null })),
});

describe("suggestKeywords", () => {
  it("인기 검색어 앞에서부터 네 개다", () => {
    expect(suggestKeywords(trending("성수", "강남", "홍대", "로테이션서울", "브런치"), "와인바")).toEqual(
      ["성수", "강남", "홍대", "로테이션서울"],
    );
  });

  it("지금 검색어는 뺀다 — 같은 0건으로 되돌아가는 칩이 된다", () => {
    expect(suggestKeywords(trending("성수", "강남", "홍대", "한남", "브런치"), " 강남 ")).toEqual([
      "성수",
      "홍대",
      "한남",
      "브런치",
    ]);
  });

  it("대소문자만 달라도 같은 검색어로 보고 뺀다", () => {
    expect(suggestKeywords(trending("Rooftop", "성수"), "rooftop")).toEqual(["성수"]);
  });

  it("인기 검색어를 못 받았으면 칩도 없다", () => {
    expect(suggestKeywords(null, "와인바")).toEqual([]);
  });

  it("고정 칩을 섞지 않는다 — 인기 검색어에 없는 `심야` 가 끼지 않는다", () => {
    expect(suggestKeywords(trending("성수"), "와인바")).toEqual(["성수"]);
  });
});

/**
 * 0건 화면이 **계약 위반을 관측하는** 판정 (`ENDPOINTS.search.trending` 5번 · 4.68 리뷰 반영).
 * 참이면 페이지가 `console.warn` 을 남긴다 — 인기 검색어가 결과 없이 올라와 있었다는 뜻이다.
 */
describe("isTrending", () => {
  it("인기 검색어에 있으면 참이다 — 대소문자·공백은 무시한다", () => {
    expect(isTrending(trending("성수"), "성수")).toBe(true);
    expect(isTrending(trending("Rooftop", "성수"), "  rooftop ")).toBe(true);
  });

  it("없으면 거짓이다 — 평범한 0건은 위반이 아니다", () => {
    expect(isTrending(trending("성수", "강남"), "와인바")).toBe(false);
  });

  it("인기 검색어를 못 받았으면 거짓이다 — 모르는 것을 위반으로 세지 않는다", () => {
    expect(isTrending(null, "성수")).toBe(false);
  });

  it("화면에 안 그리는 7위 밖도 본다 — 계약은 실려 온 목록 전체에 걸린다", () => {
    expect(isTrending(trending("1", "2", "3", "4", "5", "6", "일곱째"), "일곱째")).toBe(true);
  });
});
