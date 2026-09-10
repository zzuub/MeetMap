import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { NO_SESSION_ENTRIES } from "./_guard";

/**
 * **퍼널의 서버 진입점이 세션 가드를 부르는지 폴더를 훑어 확인한다**
 * (`decisions.md` 4.51 · 4.57).
 *
 * 4.49 의 표는 사람이 세야 갱신되고, 세 판 연속으로 그 세는 일을 틀렸다 — 화면만
 * 세고 컨트롤을 안 셌고(#24), 화면을 세고 시간을 안 셌고(#25), 쓰기를 세고 읽기를
 * 안 셌다(#25 리뷰). 그래서 **세는 일을 사람에서 테스트로 옮긴다.**
 *
 * 판정 방향이 요점이다 — **기본이 "부르라"이고, 안 부르려면 사유를 적어야 한다.**
 * 반대로 두면 새 진입점을 만들고 아무것도 안 해도 통과해 지금까지의 실수가 그대로
 * 반복된다.
 *
 * "세션에 딸린 일을 하는가"는 정적으로 판정할 수 없으므로 그 판단만 사람이 하고
 * (`NO_SESSION_ENTRIES`), **판단을 적었는지 여부**를 테스트가 강제한다.
 *
 * ⚠️ **단위가 폴더가 아니라 진입점이다** (4.57). 폴더 단위였을 때는 한 폴더에 가드가
 * 필요한 자리와 필요 없는 자리가 섞이면 아무것도 보장하지 못했다 — P2-6 이 그
 * 모양을 만들었고, 세어 보니 `terms/page`·`profile/page` 도 이미 무임승차 중이었다.
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

/** 페이지 다섯 + 액션 넷. 진입점을 못 찾으면 단언이 공허해진다 */
const MIN_ENTRIES = 9;

describe("퍼널 세션 가드 (4.49 · 4.51 · 4.57)", () => {
  const entries = funnelEntries();

  it("단계와 진입점을 실제로 찾는다 — 못 찾으면 통과시키지 않는다", () => {
    // `assert-dynamic-routes.mjs` 와 같은 자기 점검이다. 스캔이 0건을 돌려주면
    // 아래 단언들이 전부 공허하게 통과한다
    expect(new Set(entries.map((entry) => entry.step)).size).toBeGreaterThanOrEqual(
      MIN_STEPS,
    );
    expect(entries.length).toBeGreaterThanOrEqual(MIN_ENTRIES);
  });

  it("레이아웃이 가드를 부른다 — 진입 경로의 기본선이다", () => {
    expect(sourceOf(join(FUNNEL_DIR, "layout.tsx"))).toContain(GUARD_CALL);
  });

  it.each(funnelEntries().map((entry) => [entry.key, entry] as const))(
    "`%s` 는 가드를 부르거나 사유가 적혀 있다",
    (key, entry) => {
      const calls = entry.source.includes(GUARD_CALL);
      const excused = typeof NO_SESSION_ENTRIES[key] === "string";

      // 둘 다 아니면 실패다. 새 진입점을 만들고 아무것도 안 하면 여기서 걸린다
      expect(calls || excused).toBe(true);
    },
  );

  it("면제 사유는 비어 있지 않다 — 사유가 이 목록의 값이다", () => {
    for (const [key, reason] of Object.entries(NO_SESSION_ENTRIES)) {
      expect(reason.trim(), `${key} 의 사유가 비어 있다`).not.toBe("");
    }
  });

  it("면제 목록에 낡은 항목이 없다", () => {
    for (const key of Object.keys(NO_SESSION_ENTRIES)) {
      const entry = entries.find((candidate) => candidate.key === key);

      // 없어진 진입점이 목록에 남아 있으면 목록이 거짓말을 시작한다
      expect(entry, `${key} 진입점이 없는데 면제 목록에 남아 있다`).toBeDefined();

      // 가드를 부르게 됐는데 면제로 남아 있는 것도 같은 종류의 거짓말이다
      const calls = entry?.source.includes(GUARD_CALL);
      expect(calls, `${key} 는 가드를 부르므로 면제 목록에서 지운다`).toBe(false);
    }
  });
});

/* ── 폴더 훑기 ─────────────────────────────────────────── */

interface FunnelEntry {
  /** `terms/page` · `location/savePreferredAreasAction` */
  key: string;
  /** 라우트 세그먼트 이름 */
  step: string;
  /** 그 진입점 **하나의** 소스. 액션은 자기 함수 블록만이다 */
  source: string;
}

/**
 * 레이아웃 재실행 없이 서버에 닿는 자리를 센다 (4.49).
 *
 * 둘뿐이다 — **페이지 렌더**와 **Server Action 하나하나**. `_components/*` 는
 * 클라이언트라 세지 않는다(가드를 부를 수도 없다).
 *
 * 라우트 그룹(`(...)`)은 URL 을 만들지 않으므로 건너뛴다.
 */
function funnelEntries(): FunnelEntry[] {
  return readdirSync(FUNNEL_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith("("))
    .flatMap((dirent) => entriesUnder(dirent.name, join(FUNNEL_DIR, dirent.name)));
}

function entriesUnder(step: string, dir: string): FunnelEntry[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    const path = join(dir, dirent.name);
    if (dirent.isDirectory()) return entriesUnder(step, path);

    if (dirent.name === "page.tsx") {
      return [{ key: `${step}/page`, step, source: sourceOf(path) }];
    }

    const source = sourceOf(path);
    if (!/\.tsx?$/.test(dirent.name) || !source.includes("use server")) return [];

    return serverActions(source).map(({ name, body }) => ({
      key: `${step}/${name}`,
      step,
      source: body,
    }));
  });
}

/**
 * `"use server"` 파일의 export 된 async 함수를 이름 + **자기 블록**으로 자른다.
 *
 * 블록으로 자르는 것이 이 테스트의 요점이다 — 파일 전체를 보면 한 파일 안의
 * 액션 둘 중 하나만 가드를 불러도 둘 다 통과한다 (`location/_actions.ts` 가 실제로
 * 그 모양이다). 다음 `export` 직전까지를 그 함수의 몸으로 본다.
 */
function serverActions(source: string): { name: string; body: string }[] {
  const marker = /export\s+async\s+function\s+(\w+)/g;
  const found = [...source.matchAll(marker)];

  return found.map((match, index) => ({
    name: match[1],
    body: source.slice(match.index, found[index + 1]?.index ?? source.length),
  }));
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
