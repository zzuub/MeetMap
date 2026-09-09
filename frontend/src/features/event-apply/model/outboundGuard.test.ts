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

  // ── 여기부터는 못 잡는다. 코드에 그 글자가 없다 (4.38 "실수 방지" 등급) ──
  ["문자열 조합", 'const k = "external" + "ApplyUrl"; return (e as unknown as R)[k];', false],
  ["값 순회", "return Object.values(e).join();", false],
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
