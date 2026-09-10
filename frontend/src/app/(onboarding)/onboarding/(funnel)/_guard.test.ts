import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NO_SESSION_STEPS } from "./_guard";

/**
 * **퍼널 단계가 세션 가드를 부르는지 폴더를 훑어 확인한다** (`decisions.md` 4.51).
 *
 * 4.49 의 표는 사람이 세야 갱신된다. 그리고 세 판 연속으로 그 세는 일을 틀렸다 —
 * 화면만 세고 컨트롤을 안 셌고(#24), 화면을 세고 시간을 안 셌고(#25), 쓰기를 세고
 * 읽기를 안 셌다(#25 리뷰). 그래서 **세는 일을 사람에서 테스트로 옮긴다.**
 *
 * 판정 방향이 요점이다 — **기본이 "부르라"이고, 안 부르려면 사유를 적어야 한다.**
 * 반대로 두면(안 부르는 것이 기본) 새 단계를 넣고 아무것도 안 해도 통과해 지금까지의
 * 실수가 그대로 반복된다.
 *
 * "세션에 딸린 일을 하는가"는 정적으로 판정할 수 없으므로 그 판단만 사람이 하고
 * (`NO_SESSION_STEPS`), **판단을 적었는지 여부**를 테스트가 강제한다. 타입으로 잡을
 * 수 있는 자리는 `Record` 가 하고(4.42 · 4.39), 못 하는 자리는 이렇게 한다 (4.31).
 */
const FUNNEL_DIR = dirname(fileURLToPath(import.meta.url));

/**
 * ⚠️ **괄호까지 찾는다.** 처음에는 이름만(`requireFunnelSession`) 찾았는데, 호출을
 * 지우고 `import` 줄만 남겨도 통과했다 — 변이 테스트에서 걸렸고, 그게 마침
 * 2차 리뷰가 찾은 버그(`done` 의 가드 누락) 그 자체였다. 이름은 import 에도 있다.
 */
const GUARD_CALL = "requireFunnelSession(";

/** 3.2~3.5 넷 + 4장 위치 권한. 하나라도 줄면 탐지가 고장 난 것이다 */
const MIN_STEPS = 5;

describe("퍼널 세션 가드 (4.49 · 4.51)", () => {
  const steps = funnelSteps();

  it("단계를 실제로 찾는다 — 못 찾으면 통과시키지 않는다", () => {
    // `assert-dynamic-routes.mjs` 와 같은 자기 점검이다. 폴더 구조가 바뀌어
    // 스캔이 0건을 돌려주면 아래 단언들이 전부 공허하게 통과한다
    expect(steps.length).toBeGreaterThanOrEqual(MIN_STEPS);
  });

  it("레이아웃이 가드를 부른다 — 진입 경로의 기본선이다", () => {
    expect(sourceOf(join(FUNNEL_DIR, "layout.tsx"))).toContain(GUARD_CALL);
  });

  it.each(funnelSteps().map((step) => [step.name, step] as const))(
    "`%s` 는 가드를 부르거나 사유가 적혀 있다",
    (name, step) => {
      const calls = step.sources.some((source) => source.includes(GUARD_CALL));
      const excused = typeof NO_SESSION_STEPS[name] === "string";

      // 둘 다 아니면 실패다. 새 단계를 넣고 아무것도 안 하면 여기서 걸린다
      expect(calls || excused).toBe(true);
    },
  );

  it("면제 사유는 비어 있지 않다 — 사유가 이 목록의 값이다", () => {
    for (const [name, reason] of Object.entries(NO_SESSION_STEPS)) {
      expect(reason.trim(), `${name} 의 사유가 비어 있다`).not.toBe("");
    }
  });

  it("면제 목록에 낡은 항목이 없다", () => {
    for (const name of Object.keys(NO_SESSION_STEPS)) {
      const step = steps.find((candidate) => candidate.name === name);

      // 없어진 단계가 목록에 남아 있으면 목록이 거짓말을 시작한다
      expect(step, `${name} 단계가 없는데 면제 목록에 남아 있다`).toBeDefined();

      // 가드를 부르게 됐는데 면제로 남아 있는 것도 같은 종류의 거짓말이다
      const calls = step?.sources.some((source) => source.includes(GUARD_CALL));
      expect(calls, `${name} 는 가드를 부르므로 면제 목록에서 지운다`).toBe(false);
    }
  });
});

/* ── 폴더 훑기 ─────────────────────────────────────────── */

interface FunnelStep {
  /** 라우트 세그먼트 이름. `terms` `intro` `profile` `done` */
  name: string;
  /** 그 단계에 속한 모든 소스 텍스트 (`page.tsx` · `_actions.ts` · `_components/*`) */
  sources: string[];
}

/**
 * `page.tsx` 를 가진 하위 폴더를 단계로 센다.
 *
 * 라우트 그룹(`(...)`)은 URL 을 만들지 않으므로 건너뛴다 — 지금은 없지만 나중에
 * 퍼널 안에 그룹이 생기면 그 자체를 단계로 세면 안 된다.
 */
function funnelSteps(): FunnelStep[] {
  return readdirSync(FUNNEL_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("("))
    .map((entry) => ({
      name: entry.name,
      sources: sourcesUnder(join(FUNNEL_DIR, entry.name)),
    }))
    .filter((step) => step.sources.length > 0);
}

function sourcesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourcesUnder(path);
    return /\.tsx?$/.test(entry.name) ? [sourceOf(path)] : [];
  });
}

/**
 * 주석을 걷어낸 소스.
 *
 * 주석에 남은 호출(`// await requireFunnelSession();`)을 세면 지워진 가드를 통과시킨다.
 * 걷어내는 쪽은 **안전한 방향**이다 — 지나치게 지워도 없는 호출을 만들지는 못하고,
 * 최대 오탐(있는데 없다고 함)으로 끝나 사람이 바로 알아챈다.
 */
function sourceOf(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}
