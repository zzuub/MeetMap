import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSearchController, endsWithLoneJamo } from "./searchController";

/**
 * 검색 입력 → 주소 커밋 (11.1 `debounce 300ms` · `decisions.md` 4.66 표 3·4·15~17번).
 *
 * **가짜 타이머로 jsdom 없이** 잠근다 — vitest 의 가짜 타이머는 node 환경에서 돈다. 이
 * 판단을 React 밖으로 뗀 이유가 이것이다 (4.61 목록에 셋째를 올리지 않았다).
 */
function setup(initial: string | null = null) {
  const navigate = vi.fn();
  const remember = vi.fn();
  const focusInput = vi.fn();
  const controller = createSearchController(initial, { delayMs: 300, navigate, remember });
  // 화면에서는 입력창이 커밋될 때 콜백 ref 로 스스로 붙는다
  controller.attachInput(focusInput);

  return { controller, navigate, remember, focusInput };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("입력 → 커밋", () => {
  it("멈추고 300ms 가 지나야 커밋한다 — 299ms 에는 아직이다", () => {
    const { controller, navigate } = setup();

    controller.type("성수");
    vi.advanceTimersByTime(299);
    expect(navigate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(navigate).toHaveBeenCalledWith("성수");
  });

  it("치는 동안은 커밋하지 않고, 멈춘 뒤 마지막 글자로 한 번만 커밋한다", () => {
    const { controller, navigate } = setup();

    controller.type("서");
    vi.advanceTimersByTime(200);
    controller.type("성");
    vi.advanceTimersByTime(200);
    controller.type("성수");
    vi.advanceTimersByTime(300);

    expect(navigate.mock.calls).toEqual([["성수"]]);
  });

  it("정규화한 값으로 커밋한다 — 주소에 공백을 싣지 않는다", () => {
    const { controller, navigate } = setup();

    controller.type("  성수  ");
    vi.advanceTimersByTime(300);

    expect(navigate).toHaveBeenCalledWith("성수");
  });

  it("이미 걸린 검색어면 다시 가지 않는다 — 같은 조회가 한 번 더 돈다", () => {
    const { controller, navigate } = setup("성수");

    controller.type("성수 ");
    vi.advanceTimersByTime(1000);

    expect(navigate).not.toHaveBeenCalled();
  });

  it("끝 글자가 낱자면 기다린다 — `'성ㅅ' 검색 결과가 없어요` 가 깜빡이지 않게", () => {
    const { controller, navigate } = setup();

    controller.type("성ㅅ");
    vi.advanceTimersByTime(1000);
    expect(navigate).not.toHaveBeenCalled();

    controller.type("성수");
    vi.advanceTimersByTime(300);
    expect(navigate.mock.calls).toEqual([["성수"]]);
  });

  it("다 지우면 검색어 없는 주소로 간다", () => {
    const { controller, navigate } = setup("성수");

    controller.type("");
    vi.advanceTimersByTime(300);

    expect(navigate).toHaveBeenCalledWith(null);
  });

  it("입력만으로는 최근 검색어에 남기지 않는다 — `ㅅ`·`성`·`성수` 가 쌓인다", () => {
    const { controller, remember } = setup();

    controller.type("성수");
    vi.advanceTimersByTime(300);

    expect(remember).not.toHaveBeenCalled();
  });
});

describe("Enter", () => {
  it("기다리지 않고 커밋하고 최근 검색어에 남긴다", () => {
    const { controller, navigate, remember } = setup();

    controller.submit("성수");

    expect(navigate).toHaveBeenCalledWith("성수");
    expect(remember).toHaveBeenCalledWith("성수");
  });

  it("걸려 있던 debounce 를 버린다 — 커밋이 두 번 나가지 않는다", () => {
    const { controller, navigate } = setup();

    controller.type("성");
    controller.submit("성수");
    vi.advanceTimersByTime(300);

    expect(navigate.mock.calls).toEqual([["성수"]]);
  });

  it("이미 걸린 검색어면 주소는 그대로 두고 남기기만 한다", () => {
    const { controller, navigate, remember } = setup("성수");

    controller.submit(" 성수 ");

    expect(navigate).not.toHaveBeenCalled();
    expect(remember).toHaveBeenCalledWith("성수");
  });

  it("빈 채로 누르면 검색어를 지우고 아무것도 남기지 않는다", () => {
    const { controller, navigate, remember } = setup("성수");

    controller.submit("   ");

    expect(navigate).toHaveBeenCalledWith(null);
    expect(remember).not.toHaveBeenCalled();
  });
});

describe("최근 · 인기 · 추천 칩", () => {
  it("즉시 커밋하고 남긴다", () => {
    const { controller, navigate, remember } = setup();

    controller.choose("강남");

    expect(navigate).toHaveBeenCalledWith("강남");
    expect(remember).toHaveBeenCalledWith("강남");
  });

  it("빈 칩은 아무것도 하지 않는다", () => {
    const { controller, navigate, remember } = setup();

    controller.choose(" ");

    expect(navigate).not.toHaveBeenCalled();
    expect(remember).not.toHaveBeenCalled();
  });
});

describe("✕ · 다시 검색하기", () => {
  it("검색어를 비우고 입력창에 포커스한다", () => {
    const { controller, navigate, focusInput } = setup("성수");

    controller.clear();

    expect(navigate).toHaveBeenCalledWith(null);
    expect(focusInput).toHaveBeenCalledTimes(1);
  });

  it("입력창이 떨어져 있으면 포커스하지 않고 던지지도 않는다", () => {
    const { controller, navigate, focusInput } = setup("성수");

    controller.attachInput(null);
    controller.clear();

    expect(navigate).toHaveBeenCalledWith(null);
    expect(focusInput).not.toHaveBeenCalled();
  });

  it("걸려 있던 커밋을 버린다 — 지운 뒤에 친 글자로 끌려가지 않는다", () => {
    const { controller, navigate } = setup();

    controller.type("강남");
    controller.clear();
    vi.advanceTimersByTime(300);

    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("dispose", () => {
  it("화면을 떠나면 걸린 커밋을 버린다 — 다른 화면에서 `/search` 로 끌려오지 않게", () => {
    const { controller, navigate } = setup();

    controller.type("성수");
    controller.dispose();
    vi.advanceTimersByTime(300);

    expect(navigate).not.toHaveBeenCalled();
  });
});

describe("endsWithLoneJamo", () => {
  it("끝이 자음·모음 낱자면 조합 중이다", () => {
    expect(endsWithLoneJamo("성ㅅ")).toBe(true);
    expect(endsWithLoneJamo("ㅏ")).toBe(true);
    // 조합형 자모(U+1100~)도 본다 — IME 에 따라 이쪽으로 들어온다
    expect(endsWithLoneJamo(`성${String.fromCharCode(0x1109)}`)).toBe(true);
  });

  it("완성된 음절이나 로마자로 끝나면 아니다", () => {
    expect(endsWithLoneJamo("성수")).toBe(false);
    expect(endsWithLoneJamo("ㅋㅋ 성수")).toBe(false);
    expect(endsWithLoneJamo("Bar")).toBe(false);
  });
});
