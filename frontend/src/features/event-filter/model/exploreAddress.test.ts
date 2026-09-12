import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * **조건이 붙은 탐색 주소를 손으로 쓴 소스가 없다** (`decisions.md` 4.24 · 4.25 → 4.71).
 *
 * 조건을 걸 때도 풀 때도 `exploreHref` 를 거친다 — 손으로 쓰면 `eligibleOnly=0` 이 떨어지거나
 * 기본값이 주소에 실린다. P3-1 이 지도 진입 둘(`프로모 카드` · `지역 바로가기`)을 고치다 같은
 * 자리를 넷 더 찾았다(`전체보기 >` 셋 · 하단 탭). 사람이 다시 세지 않게 여기서 센다 (4.51).
 *
 * 판정 방향은 `못 찾으면 실패` 다. 예외가 필요해지면 **사유와 함께 목록을 두고** 여기서 뺀다.
 *
 * 테스트 파일은 훑지 않는다 — 픽스처의 주소는 만드는 것이 아니라 받는 것이다. 조건 없는
 * `/explore` 는 대상이 아니다(조립할 것이 없다).
 */
const SRC_DIR = fileURLToPath(new URL("../../../", import.meta.url));

/** `"/explore?…"` · `'/explore?…'` · `` `/explore?${…}` `` */
const HAND_BUILT = /["'`]\/explore\?/;

/** 소스가 이보다 적으면 훑기가 고장 난 것이다 — 0건이면 아래 단언이 공허하게 통과한다 */
const MIN_FILES = 150;

describe("탐색 주소는 exploreHref 만 만든다 (4.24)", () => {
  const files = sourceFiles(SRC_DIR);

  it("소스를 실제로 훑는다", () => {
    expect(files.length).toBeGreaterThanOrEqual(MIN_FILES);
  });

  it("`/explore?` 를 손으로 쓴 소스가 없다", () => {
    const offenders = files
      .filter((file) => HAND_BUILT.test(withoutComments(readFileSync(file, "utf8"))))
      .map((file) => relative(SRC_DIR, file));

    expect(
      offenders,
      "조건이 붙은 탐색 주소는 `exploreHref` 로 만든다 — 손으로 쓰면 `eligibleOnly=0` 이 " +
        "떨어지거나 기본값이 실린다",
    ).toEqual([]);
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

/**
 * 주석을 걷어낸 소스 — 주석이 규칙을 설명하느라 `/explore?` 를 인용한다. 줄 주석을 걷을 때
 * `https://` 뒤도 함께 지워질 수 있다 — 같은 줄의 주소를 놓치는 쪽이라 드물게 못 찾을 뿐
 * 없는 것을 찾지는 않는다.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}
