import { ESLint } from "eslint";
import { beforeAll, describe, expect, it } from "vitest";

/**
 * **7.3 우회를 막는 린트 규칙 자체의 테스트** (`decisions.md` 4.38).
 *
 * 이 규칙은 세 라운드에 걸쳐 세 번 뚫렸다. 매번 방어선을 만든 뒤 *떠오른 형태만*
 * 확인했기 때문이다 — 점 표기만 보고 구조분해를 놓쳤고, 구조분해를 막고 나서
 * 템플릿 리터럴과 문자열 키를 놓쳤다. **우회 목록을 코드로 고정하지 않으면
 * 같은 일이 또 일어난다.**
 *
 * 그래서 `externalApplyUrl` 이라는 **글자가 소스에 나타나는 모든 AST 형태**를
 * 여기 적어 두고 린트를 실제로 돌린다. 새 형태가 생각나면 표에 줄을 더한다.
 *
 * `caught: false` 줄은 **포기한 것이 아니라 등급 선언**이다 — 코드에 그 글자가
 * 없어 정적 선택자로 원천 불가능한 형태다. 누군가 규칙을 넓혀 이게 잡히게 되면
 * 이 테스트가 실패해 4.38 의 "실수 방지 등급" 문장을 함께 고치게 한다.
 */

/** 슬라이스 밖이라 규칙이 걸리는 자리. 실제로 파일을 만들지는 않는다 */
const OUTSIDE = "src/widgets/event-detail/ui/__guard-probe.tsx";

const cases: [name: string, expr: string, caught: boolean][] = [
  ["점 표기", "return e.externalApplyUrl;", true],
  ["옵셔널 체이닝", "return e?.externalApplyUrl;", true],
  ["캐스팅 뒤 점 표기", "return (e as unknown as R).externalApplyUrl;", true],
  ["대괄호 + 문자열", 'return e["externalApplyUrl"];', true],
  ["대괄호 + 템플릿 리터럴", "return e[`externalApplyUrl`];", true],
  ["구조분해", "const { externalApplyUrl } = e; return externalApplyUrl;", true],
  [
    "기본값 붙은 구조분해",
    'const { externalApplyUrl = "" } = e; return externalApplyUrl;',
    true,
  ],
  [
    "중첩 구조분해",
    "const { a: { externalApplyUrl } } = { a: e }; return externalApplyUrl;",
    true,
  ],
  ["문자열 키 구조분해", 'const { "externalApplyUrl": u } = e; return u;', true],
  ["계산 키 구조분해", 'const { ["externalApplyUrl"]: u } = e; return u;', true],
  ["rest 로 뽑아낸 뒤 점 표기", "const { ...r } = e; return r.externalApplyUrl;", true],

  /*
    ── 여기부터는 못 잡는다 (4.38 "실수 방지" 등급) ──

    선택자가 보는 것은 `MemberExpression` 과 `ObjectPattern > Property` 두 형태뿐이다.
    처음에는 "코드에 그 글자가 없는 것만 못 잡는다"고 적었는데 **틀렸다** — 아래
    리플렉션 줄들은 `"externalApplyUrl"` 이 소스에 그대로 있고 grep 으로도 잡히는데
    `CallExpression` 의 인자라 다섯 분기를 전부 비켜 간다 (PR #32 리뷰).

    **여기서 선택자를 더 늘리지 않는다.** `Reflect.get`·`getOwnPropertyDescriptor`·
    제네릭 접근자·lodash `get` … 목록은 끝이 없고, 그걸 쫓는 것이 이 규칙이 세 라운드
    연속 뚫린 방식이다. 대신 **등급을 정직하게 적는다.**
  */
  ["문자열 조합", 'const k = "external" + "ApplyUrl"; return (e as unknown as R)[k];', false],
  ["값 순회", "return Object.values(e).join();", false],
  ["Reflect.get", 'return Reflect.get(e, "externalApplyUrl");', false],
  [
    "제네릭 키 접근자",
    "const pick = <K extends keyof EventDetail>(x: EventDetail, k: K) => x[k];" +
      ' return pick(e, "externalApplyUrl");',
    false,
  ],
];

/**
 * 규칙이 걸리는 자리가 `event-detail` 하나가 아님을 본다.
 *
 * 프로브 경로가 하나뿐이면 `files` 를 좁히거나 다른 위치를 `ignores` 에 넣는
 * 변경이 **이 테스트를 통과한 채로** 그 위치의 보호를 지운다 (PR #32 리뷰).
 */
const GUARDED_PATHS = [
  "src/widgets/explore-board/ui/__guard-probe.tsx",
  "src/entities/event/ui/__guard-probe.tsx",
  "src/app/(stack)/events/[eventId]/__guard-probe.tsx",
];

describe("externalApplyUrl 접근 금지 규칙", () => {
  const eslint = new ESLint();

  const violations = async (expr: string) => {
    const code = [
      'import type { EventDetail } from "@/entities/event";',
      "type R = Record<string, string>;",
      `export function probe(e: EventDetail) { ${expr} }`,
    ].join("\n");

    const [result] = await eslint.lintText(code, { filePath: OUTSIDE });
    return result.messages.filter((m) => m.ruleId === "no-restricted-syntax");
  };

  // 첫 `lintText` 가 flat config 전체(next 프리셋 포함)를 읽어 몇 초 걸린다.
  // 케이스마다 물리면 첫 줄만 타임아웃 나므로 여기서 한 번에 치른다.
  beforeAll(async () => {
    await violations("return 1;");
  }, 60_000);

  it.each(cases)("%s", async (_name, expr, caught) => {
    expect((await violations(expr)).length > 0).toBe(caught);
  });

  /**
   * `severity` 를 본다. `"error"` 를 `"warn"` 으로 낮추면 메시지는 그대로 나와
   * 위 케이스가 전부 통과하지만 `npm run lint` 는 빌드를 막지 못한다 — 규칙이
   * 무력해지는데 스위트는 초록인 상태다 (PR #32 리뷰).
   */
  it("경고가 아니라 에러다", async () => {
    const [message] = await violations("return e.externalApplyUrl;");
    expect(message.severity).toBe(2);
  });

  it.each(GUARDED_PATHS)("%s 에서도 걸린다", async (filePath) => {
    const [result] = await eslint.lintText(
      "export const go = (e: { externalApplyUrl: string }) => e.externalApplyUrl;",
      { filePath },
    );

    expect(
      result.messages.filter((m) => m.ruleId === "no-restricted-syntax"),
    ).not.toEqual([]);
  });

  /**
   * 슬라이스 **안**에서는 전부 통과해야 한다. `ignores` 가 빠지면 모달 자신이
   * 자기 규칙에 걸려 아무도 이 URL 을 못 읽게 된다.
   */
  it("features/event-apply 안에서는 걸리지 않는다", async () => {
    const [result] = await eslint.lintText(
      'export const go = (e: { externalApplyUrl: string }) => e.externalApplyUrl;',
      { filePath: "src/features/event-apply/ui/__guard-probe.ts" },
    );

    expect(result.messages.filter((m) => m.ruleId === "no-restricted-syntax")).toEqual([]);
  });
});
