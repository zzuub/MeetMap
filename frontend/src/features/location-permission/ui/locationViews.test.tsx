import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { LocationPermissionState } from "@/entities/user";
import { SORT_OPTIONS } from "@/shared/config";
import {
  DENIED_BANNER,
  MAP_AXIS_PHRASES,
  REQUIRED_PHRASES,
  deniedReasonFromCode,
} from "../model/copy";
import type { DeniedReason, NearbySummary } from "../model/types";
import { LocationAsking } from "./LocationAsking";
import { LocationDenied } from "./LocationDenied";
import { LocationGranted } from "./LocationGranted";

/**
 * **세 상태의 문구가 실제로 그려지는지** 본다 (4.1~4.3).
 *
 * 상수만 잠그면 JSX 에서 `{false && …}` 로 조용히 감추는 변경을 못 잡는다 —
 * `ApplyOutboundModal.test.tsx`·`ErrorState.test.tsx` 와 같은 이유다 (4.39).
 * jsdom 은 붙이지 않는다 (4.10): 세 화면 다 훅이 없는 순수 컴포넌트라
 * `react-dom/server` 로 충분하다. 훅은 전부 `LocationPermissionGate` 에 있다.
 */
const summary: NearbySummary = {
  label: "서울 성동구 성수동",
  area: "성수·건대",
  counts: { total: 3, today: { dinner: 2, lateNight: 1 } },
  href: "/explore?area=%EC%84%B1%EC%88%98",
};

const MARKUP: Record<LocationPermissionState, () => string> = {
  asking: () =>
    renderToStaticMarkup(
      <LocationAsking
        supported
        pending={false}
        failure={null}
        onAllow={noop}
        onChooseArea={noop}
      />,
    ),
  granted: () =>
    renderToStaticMarkup(<LocationGranted summary={summary} onChooseArea={noop} />),
  denied: () => denied("PERMISSION"),
};

describe("위치 권한 3상태의 문구 (4.1~4.3)", () => {
  it.each(Object.keys(MARKUP) as LocationPermissionState[])(
    "`%s` 는 필수 문구를 전부 그린다",
    (state) => {
      const markup = MARKUP[state]();
      for (const phrase of REQUIRED_PHRASES[state]) {
        expect(markup, `${state} 에 '${phrase}' 가 없다`).toContain(phrase);
      }
    },
  );

  it("0건이면 찾았다고 하지 않는다 — 그래도 나갈 길은 남긴다 (11.2)", () => {
    const markup = renderToStaticMarkup(
      <LocationGranted
        summary={{ ...summary, counts: { total: 0, today: null } }}
        onChooseArea={noop}
      />,
    );

    expect(markup).not.toContain("건을 찾았습니다");
    expect(markup).toContain("아직 못 찾았어요");
    expect(markup).toContain("주변 소개팅 보기");
  });

  it("오늘 건수를 못 셌으면 그 줄을 그리지 않는다 (4.28)", () => {
    // 0건(정상)과 못 셈(`null`)은 다른 상태다. 못 셌는데 `저녁 0건` 이라고 하면
    // 침묵하는 오답이다
    const markup = renderToStaticMarkup(
      <LocationGranted
        summary={{ ...summary, counts: { total: 3, today: null } }}
        onChooseArea={noop}
      />,
    );

    expect(markup).not.toContain("저녁");
    expect(markup).toContain("건을 찾았습니다");
  });

  it("`asking` 의 개인정보 고지는 상수가 아니라 화면에 있다 (4.1 고정 문구)", () => {
    // 이 문구가 화면의 저장 범위를 정한다 — 감추면 약속이 사라진다 (4.54)
    expect(MARKUP.asking()).toContain(REQUIRED_PHRASES.asking[0]);
  });

  it("`denied` 사유 셋이 각각 자기 배너를 그린다", () => {
    for (const reason of Object.keys(DENIED_BANNER) as DeniedReason[]) {
      expect(denied(reason)).toContain(DENIED_BANNER[reason].title);
    }
  });

  it("사유가 셋 다 다른 문구다 — 같으면 나눈 뜻이 없다", () => {
    const titles = Object.values(DENIED_BANNER).map((banner) => banner.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe("비활성 라벨이 사유를 말한다 (2.5)", () => {
  it("지역을 하나도 안 고르면 라벨이 사유이고 별도 토스트가 없다", () => {
    expect(denied("PERMISSION")).toContain("지역을 1개 이상 선택해주세요");
  });

  it("지역을 고르면 개수를 말한다", () => {
    expect(denied("PERMISSION", ["성수·건대", "강남·역삼"])).toContain(
      "개 지역으로 시작하기",
    );
  });

  it("브라우저가 지원하지 않으면 요청 버튼의 라벨이 그 사유다", () => {
    const markup = renderToStaticMarkup(
      <LocationAsking
        supported={false}
        pending={false}
        failure={null}
        onAllow={noop}
        onChooseArea={noop}
      />,
    );

    expect(markup).toContain("이 브라우저는 위치를 지원하지 않아요");
    expect(markup).toContain("disabled");
  });
});

/**
 * **P3-1 이 거리·지도 축을 만들면 이 테스트가 문구를 도로 요구한다** (4.56).
 *
 * 지금은 `SORT_OPTIONS` 에 거리순이 없어 4.1 혜택 ①② · 4.2 반경 · 4.3 제약 안내를
 * 쓰지 않았다. 양방향 단언이라 **축이 생기는 순간 빨간불이 켜진다** — 되돌릴 문구를
 * 사람이 기억하지 않아도 된다 (`decisions.md` 4.51 의 처방).
 */
describe("없는 기능을 약속하지 않는다 (4.56)", () => {
  const hasDistanceAxis = (SORT_OPTIONS as readonly { code: string }[]).some(
    (option) => option.code === DISTANCE_SORT_CODE,
  );

  it.each(MAP_AXIS_PHRASES)("`%s` 는 거리 축의 유무를 따른다", (phrase) => {
    const all = Object.values(MARKUP)
      .map((render) => render())
      .join("");

    expect(
      all.includes(phrase),
      hasDistanceAxis
        ? `거리 축이 생겼으니 '${phrase}' 를 4장 문구대로 되돌린다`
        : `'${phrase}' 는 아직 없는 기능을 약속한다`,
    ).toBe(hasDistanceAxis);
  });
});

describe("`denied` 로 떨어지는 길 (4.3)", () => {
  it("권한 거부만 `PERMISSION` 이다", () => {
    expect(deniedReasonFromCode(1)).toBe("PERMISSION");
  });

  it("위치 실패·타임아웃은 권한 문제가 아니다", () => {
    expect(deniedReasonFromCode(2)).toBe("UNAVAILABLE");
    expect(deniedReasonFromCode(3)).toBe("UNAVAILABLE");
  });

  it("모르는 코드를 권한 문제로 읽지 않는다 — 켤 것이 없는 설정으로 보낸다", () => {
    for (const code of [0, 4, 99, -1, Number.NaN]) {
      expect(deniedReasonFromCode(code)).not.toBe("PERMISSION");
    }
  });
});

/** P3-1 이 `SORT_OPTIONS` 에 더할 코드. 유니온에 아직 없어서 문자열로 적는다 */
const DISTANCE_SORT_CODE = "distance";

function denied(reason: DeniedReason, areas: readonly string[] = []): string {
  return renderToStaticMarkup(
    <LocationDenied
      reason={reason}
      areas={areas}
      pending={false}
      failure={null}
      formAction={noop}
      onToggleArea={noop}
      onRetry={noop}
    />,
  );
}

function noop() {}
