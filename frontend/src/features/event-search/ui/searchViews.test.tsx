import { isValidElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { TrendingSnapshot } from "@/entities/search";
import { KeywordSuggestionsView } from "./KeywordSuggestions";
import { RecentKeywordsView } from "./RecentKeywords";
import { isResultLinkClick } from "./RememberOnResultClick";
import { SearchField } from "./SearchField";
import { TrendingKeywordsView } from "./TrendingKeywords";

/**
 * 검색 화면의 **훅 없는 조각들**이 무엇을 그리고, 핸들러가 무엇을 부르는가 (11.1).
 *
 * jsdom 없이 본다 (4.10). 마크업은 `renderToStaticMarkup` 으로, 핸들러는 컴포넌트를
 * **함수로 불러** 돌려받은 엘리먼트의 prop 을 직접 부른다 (4.39 수법 · `decisions.md`
 * 4.61 P2-9 표). 문구는 리터럴로 단언한다 (4.52).
 */

type AnyElement = ReactElement<Record<string, unknown>>;

/** 돌려받은 트리에서 조건에 맞는 엘리먼트를 전부 찾는다 — 함수 컴포넌트는 펼치지 않는다 */
function findAll(node: ReactNode, match: (element: AnyElement) => boolean): AnyElement[] {
  const found: AnyElement[] = [];
  const visit = (current: ReactNode) => {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }
    if (!isValidElement<Record<string, unknown>>(current)) return;
    if (match(current)) found.push(current);
    visit(current.props.children as ReactNode);
  };
  visit(node);
  return found;
}

function call(element: AnyElement | undefined, prop: string, ...args: unknown[]) {
  const handler = element?.props[prop];
  if (typeof handler !== "function") throw new Error(`${prop} 핸들러가 없다`);
  handler(...args);
}

const noop = () => {};

describe("SearchField — 헤더 입력 (11.1)", () => {
  const markup = (value: string) =>
    renderToStaticMarkup(
      <SearchField value={value} onChange={noop} onSubmit={noop} onClear={noop} />,
    );

  it("검색 폼이고, 라벨·자리표시자·검색 키를 갖는다", () => {
    const html = markup("");

    expect(html).toContain('role="search"');
    expect(html).toContain('type="search"');
    expect(html).toContain('placeholder="소개팅명, 지역, 주최사 검색"');
    expect(html).toMatch(/enterkeyhint="search"/i);
    expect(html).toContain('<span class="sr-only">검색어</span>');
  });

  it("✕ 는 글자가 있을 때만 그린다", () => {
    expect(markup("")).not.toContain("검색어 지우기");
    expect(markup("성수")).toContain('aria-label="검색어 지우기"');
  });

  it("Enter 는 네이티브 제출을 막고 `onSubmit` 을 부른다", () => {
    const onSubmit = vi.fn();
    const preventDefault = vi.fn();
    const tree = SearchField({ value: "성수", onChange: noop, onSubmit, onClear: noop });

    call(findAll(tree, (element) => element.type === "form")[0], "onSubmit", { preventDefault });

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("입력은 글자를 그대로 넘기고, ✕ 는 `onClear` 를 부른다", () => {
    const onChange = vi.fn();
    const onClear = vi.fn();
    const tree = SearchField({ value: "성수", onChange, onSubmit: noop, onClear });

    call(findAll(tree, (element) => element.type === "input")[0], "onChange", {
      target: { value: "성수 루" },
    });
    call(findAll(tree, (element) => element.props.label === "검색어 지우기")[0], "onClick");

    expect(onChange).toHaveBeenCalledWith("성수 루");
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});

describe("RecentKeywordsView — 최근 검색어 (4.69)", () => {
  const handlers = { onChoose: noop, onRemove: noop, onClearAll: noop };

  it("저장소를 읽기 전(`unknown`)에는 없다고 말하지 않는다 — `전체 삭제` 도 없다", () => {
    const html = renderToStaticMarkup(
      <RecentKeywordsView snapshot={{ status: "unknown" }} {...handlers} />,
    );

    expect(html).toContain("최근 검색어");
    expect(html).not.toContain("최근 검색 기록이 없습니다");
    expect(html).not.toContain("전체 삭제");
  });

  it("0건이면 문구를 쓰고 `전체 삭제` 는 그리지 않는다", () => {
    const html = renderToStaticMarkup(
      <RecentKeywordsView snapshot={{ status: "ready", keywords: [] }} {...handlers} />,
    );

    expect(html).toContain("최근 검색 기록이 없습니다");
    expect(html).not.toContain("전체 삭제");
  });

  it("있으면 칩과 개별 삭제(44px)·전체 삭제를 그린다", () => {
    const html = renderToStaticMarkup(
      <RecentKeywordsView snapshot={{ status: "ready", keywords: ["성수", "강남"] }} {...handlers} />,
    );

    expect(html).toContain(">성수</button>");
    expect(html).toContain(">강남</button>");
    expect(html).toContain("전체 삭제");
    expect(html).toContain("aria-label=\"최근 검색어 &#x27;성수&#x27; 삭제\"");
    expect(html).toMatch(/<button type="button" aria-label="최근 검색어[^"]*" class="[^"]*size-11/);
  });

  it("저장이 막혔으면 섹션을 그리지 않는다", () => {
    expect(
      renderToStaticMarkup(<RecentKeywordsView snapshot={{ status: "unavailable" }} {...handlers} />),
    ).toBe("");
  });

  it("칩은 재검색, ✕ 는 그 검색어 삭제, `전체 삭제` 는 전부 삭제를 부른다", () => {
    const onChoose = vi.fn();
    const onRemove = vi.fn();
    const onClearAll = vi.fn();
    const tree = RecentKeywordsView({
      snapshot: { status: "ready", keywords: ["성수", "강남"] },
      onChoose,
      onRemove,
      onClearAll,
    });

    call(findAll(tree, (element) => element.props.children === "강남")[0], "onClick");
    call(
      findAll(tree, (element) => element.props.label === "최근 검색어 '성수' 삭제")[0],
      "onClick",
    );
    call(findAll(tree, (element) => element.props.children === "전체 삭제")[0], "onClick");

    expect(onChoose).toHaveBeenCalledWith("강남");
    expect(onRemove).toHaveBeenCalledWith("성수");
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });
});

describe("TrendingKeywordsView — 인기 검색어 (11.1 · 4.68)", () => {
  const snapshot: TrendingSnapshot = {
    baseAt: "2026-09-11T01:00:00Z",
    keywords: [
      { keyword: "성수", previousRank: 1 },
      { keyword: "강남", previousRank: 3 },
      { keyword: "홍대", previousRank: 2 },
      { keyword: "로테이션서울", previousRank: null },
      { keyword: "브런치", previousRank: 8 },
      { keyword: "한남", previousRank: 4 },
      { keyword: "일곱째", previousRank: 5 },
    ],
  };
  const html = renderToStaticMarkup(<TrendingKeywordsView snapshot={snapshot} onChoose={noop} />);

  it("Top 6 까지만 그린다", () => {
    expect(html.match(/<li/g)).toHaveLength(6);
    expect(html).not.toContain("일곱째");
  });

  it("기준 시각을 KST 로 쓴다", () => {
    expect(html).toContain("9/11 10:00 기준");
  });

  it("1~3위 숫자만 강조색이다", () => {
    expect(html).toMatch(/class="[^"]*text-point[^"]*">3<\/span>/);
    expect(html).toMatch(/class="[^"]*text-text-sub[^"]*">4<\/span>/);
  });

  it("증감 네 모양을 쓰고, 스크린리더에는 말로 준다", () => {
    for (const text of [">—<", ">+1<", ">-1<", ">new<", ">+3<", ">-2<"]) {
      expect(html).toContain(text);
    }
    expect(html).toContain('<span class="sr-only">1계단 상승</span>');
    expect(html).toContain('<span class="sr-only">새로 진입</span>');
  });

  it("검색어가 없으면 섹션을 그리지 않는다", () => {
    expect(
      renderToStaticMarkup(
        <TrendingKeywordsView snapshot={{ ...snapshot, keywords: [] }} onChoose={noop} />,
      ),
    ).toBe("");
  });

  it("줄을 누르면 그 검색어로 검색한다", () => {
    const onChoose = vi.fn();
    const tree = TrendingKeywordsView({ snapshot, onChoose });

    call(findAll(tree, (element) => element.type === "button")[1], "onClick");

    expect(onChoose).toHaveBeenCalledWith("강남");
  });
});

describe("KeywordSuggestionsView — 결과 없음의 추천 칩 (4.68)", () => {
  it("추천이 없으면 머리까지 그리지 않는다", () => {
    expect(renderToStaticMarkup(<KeywordSuggestionsView keywords={[]} onChoose={noop} />)).toBe("");
  });

  it("칩은 토글이 아니라 검색 버튼이다 — `aria-pressed` 를 붙이지 않는다", () => {
    const html = renderToStaticMarkup(
      <KeywordSuggestionsView keywords={["성수", "강남"]} onChoose={noop} />,
    );

    expect(html).toContain("이런 검색은 어때요?");
    expect(html).toContain(">성수</button>");
    expect(html).not.toContain("aria-pressed");
  });

  it("칩을 누르면 그 검색어로 검색한다", () => {
    const onChoose = vi.fn();
    const tree = KeywordSuggestionsView({ keywords: ["성수", "강남"], onChoose });

    call(findAll(tree, (element) => element.props.children === "성수")[0], "onClick");

    expect(onChoose).toHaveBeenCalledWith("성수");
  });
});

describe("isResultLinkClick — 결과를 누르면 검색어를 남긴다 (4.69)", () => {
  const target = (link: boolean) =>
    ({ closest: (selector: string) => (link && selector === "a[href]" ? {} : null) }) as unknown as EventTarget;

  it("카드 링크에서 올라온 클릭이면 남긴다", () => {
    expect(isResultLinkClick(target(true))).toBe(true);
  });

  it("하트(`button`)처럼 링크가 아닌 곳이면 남기지 않는다", () => {
    expect(isResultLinkClick(target(false))).toBe(false);
  });

  it("`closest` 가 없는 대상이나 `null` 은 링크가 아니다", () => {
    expect(isResultLinkClick(null)).toBe(false);
    expect(isResultLinkClick({} as EventTarget)).toBe(false);
  });
});
