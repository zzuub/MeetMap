import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, sep } from "node:path";
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

/**
 * **서버 진입점이 아닌 export** — Next 라우트 세그먼트 설정. 값이지 함수가 아니다.
 *
 * 이 목록이 있는 이유는 아래 `스캔이 못 본 export 가 없다` 단언 때문이다. 그 단언은
 * **분류되지 않은 export 를 전부 실패로 만든다** — 그래야 스캐너가 **못 보는 모양**을
 * 조용히 통과시키지 않는다 (4.57 의 교훈: 휴리스틱은 자기가 못 보는 것을 신고해야 한다).
 */
const SEGMENT_CONFIG = new Set([
  "dynamic",
  "dynamicParams",
  "revalidate",
  "fetchCache",
  "runtime",
  "preferredRegion",
  "maxDuration",
  "metadata",
]);

describe("퍼널 세션 가드 (4.49 · 4.51 · 4.57)", () => {
  const { entries, unclassified } = scanFunnel();

  it("단계와 진입점을 실제로 찾는다 — 못 찾으면 통과시키지 않는다", () => {
    // `assert-dynamic-routes.mjs` 와 같은 자기 점검이다. 스캔이 0건을 돌려주면
    // 아래 단언들이 전부 공허하게 통과한다
    expect(new Set(entries.map((entry) => entry.step)).size).toBeGreaterThanOrEqual(
      MIN_STEPS,
    );
    expect(entries.length).toBeGreaterThanOrEqual(MIN_ENTRIES);
  });

  /**
   * ⚠️ **하한선(`MIN_ENTRIES`)만으로는 부족하다.** 그건 "있던 것이 사라지는" 변이는
   * 잡지만 **"새로 생긴 것이 안 보이는"** 변이는 못 잡는다 — 화살표 액션을 하나 더
   * 붙이면 개수가 줄지 않으므로 하한선을 그대로 통과한다 (PR #36 3차 리뷰).
   *
   * 그래서 스캐너가 **분류하지 못한 export 를 신고**하게 한다. 이쪽이 방향이 맞다 —
   * 기본이 `세었다` 가 아니라 `못 세면 실패` 다 (`NO_SESSION_ENTRIES` 의 판정 방향과 같다).
   */
  it("스캔이 못 본 export 가 없다 — 휴리스틱이 자기 한계를 신고한다", () => {
    expect(
      unclassified,
      "서버 진입점 파일에 스캐너가 분류하지 못한 export 가 있다. " +
        "진입점이면 스캔 규칙을 넓히고, 아니면 `SEGMENT_CONFIG` 에 더한다",
    ).toEqual([]);
  });

  it("레이아웃이 가드를 부른다 — 진입 경로의 기본선이다", () => {
    expect(sourceOf(join(FUNNEL_DIR, "layout.tsx"))).toContain(GUARD_CALL);
  });

  it.each(scanFunnel().entries.map((entry) => [entry.key, entry] as const))(
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
  /** `terms/page` · `location/savePreferredAreasAction` · `location/generateMetadata` */
  key: string;
  /** 라우트 세그먼트 이름 */
  step: string;
  /** 그 진입점 **하나의** 소스. 파일 전체가 아니라 자기 export 블록이다 */
  source: string;
}

interface Scan {
  entries: FunnelEntry[];
  /** 분류하지 못한 export. **하나라도 있으면 스캔을 믿지 않는다** */
  unclassified: string[];
}

/**
 * 레이아웃 재실행 없이 서버에 닿는 자리를 센다 (4.49).
 *
 * 둘뿐이다 — **페이지 파일의 export** 와 **Server Action 하나하나**. `_components/*`
 * 는 클라이언트라 아예 훑지 않는다(가드를 부를 수도 없다).
 *
 * ⚠️ **페이지도 액션과 같은 단위로 자른다** (PR #36 3차 리뷰). 처음엔 `page.tsx`
 * **파일 전체**를 한 진입점의 소스로 썼는데, `generateMetadata` 는 새 파일이 아니라
 * **기존 `page.tsx` 안에 두 번째 export 로** 붙는 것이 Next 관례다. 그러면 default
 * export 가 부르는 가드 덕에 가드 없는 `generateMetadata` 가 조용히 통과한다 —
 * 이번 판에서 폴더→진입점으로 좁힌 것과 **같은 단위 실수가 한 단계 안쪽에** 남아
 * 있었다.
 *
 * 라우트 그룹(`(...)`)은 URL 을 만들지 않으므로 건너뛴다.
 */
function scanFunnel(): Scan {
  const steps = readdirSync(FUNNEL_DIR, { withFileTypes: true }).filter(
    (dirent) => dirent.isDirectory() && !dirent.name.startsWith("("),
  );

  const scans = steps.flatMap((dirent) =>
    filesUnder(join(FUNNEL_DIR, dirent.name)).flatMap((path) =>
      scanFile(dirent.name, path),
    ),
  );

  return {
    entries: scans.flatMap((scan) => scan.entries),
    unclassified: scans.flatMap((scan) => scan.unclassified),
  };
}

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((dirent) => {
    const path = join(dir, dirent.name);
    if (dirent.isDirectory()) return filesUnder(path);
    return /\.tsx?$/.test(dirent.name) ? [path] : [];
  });
}

/** 서버 진입점을 담을 수 있는 파일만 훑는다 — 페이지와 `"use server"` 파일 */
function scanFile(step: string, path: string): Scan[] {
  const isPage = path.endsWith(`${sep}page.tsx`);
  const source = sourceOf(path);

  if (!isPage && !source.includes("use server")) return [];
  return [exportedEntries(step, source, isPage)];
}

/**
 * 파일의 top-level export 를 **하나씩** 분류하고 자기 블록으로 자른다.
 *
 * 분류하지 못한 export 를 `unclassified` 로 돌려주는 것이 핵심이다 — 스캐너가
 * **못 보는 모양**(화살표 액션 `export const x = async () => {}` · re-export 등)을
 * 만나면 조용히 넘기지 않고 신고한다. 휴리스틱이 자기 한계를 스스로 드러내야
 * "통과했다"가 뜻을 갖는다 (4.57).
 */
function exportedEntries(step: string, source: string, isPage: boolean): Scan {
  const marks = [...source.matchAll(/^export\s.*$/gm)];
  const entries: FunnelEntry[] = [];
  const unclassified: string[] = [];

  marks.forEach((mark, index) => {
    const body = source.slice(mark.index, marks[index + 1]?.index ?? source.length);
    const line = mark[0];

    const fn = /^export\s+(?:default\s+)?(?:async\s+)?function\s+(\w+)/.exec(line);
    if (fn) {
      const name = line.includes("export default") && isPage ? "page" : fn[1];
      entries.push({ key: `${step}/${name}`, step, source: body });
      return;
    }

    // 라우트 세그먼트 설정은 값이라 진입점이 아니다
    const value = /^export\s+(?:const|let|var)\s+(\w+)/.exec(line);
    if (value && SEGMENT_CONFIG.has(value[1])) return;

    unclassified.push(`${step}: ${line.trim()}`);
  });

  return { entries, unclassified };
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
