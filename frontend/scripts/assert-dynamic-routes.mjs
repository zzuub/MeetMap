import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

/**
 * `eventApi` 를 무는 라우트가 **정적 프리렌더되지 않았는지** 빌드 산출물로 확인한다.
 *
 * 목 회차의 날짜는 이번 주 월요일 기준 상대값이라(`decisions.md` 4.31), 그 데이터를
 * 쓰는 페이지가 프리렌더되면 **빌드한 주의 날짜가 HTML 에 굳어** 영원히 안 바뀐다.
 * `/design-system` 이 실제로 그 상태였고, `next build` 출력의 `○` 표시가 내내
 * 말하고 있었는데 아무도 안 봤다 (PR #27 3차 리뷰).
 *
 * 그래서 사람이 눈으로 하던 확인을 그대로 자동화한다 — 빌드 stdout 의 라우트 표를
 * 읽어 대상 라우트가 전부 `ƒ`(Dynamic)인지 본다.
 *
 * 사용법: `npm run build | tee build.log && node scripts/assert-dynamic-routes.mjs build.log`
 *
 * ⚠️ **`page.tsx` 가 직접 `eventApi` 를 import 하는 경우만 본다.** 이 리포는 app
 * 레이어가 데이터를 받아 아래로 넘기는 구조라(FSD) 지금은 이걸로 충분하지만,
 * 중첩 서버 컴포넌트가 스스로 조회하기 시작하면 여기도 같이 넓혀야 한다.
 */

const APP_DIR = join("src", "app");
const NEEDLE = "eventApi";
/** `next build` 의 라우트 표: `┌ ƒ /explore` / `├ ○ /likes` */
const ROUTE_LINE = /^[┌├└│]\s*([ƒ○●λ])\s+(\S+)/;

const logPath = process.argv[2];
if (!logPath) {
  fail("빌드 로그 경로가 필요하다: node scripts/assert-dynamic-routes.mjs <build.log>");
}

const routes = routesUsingEventApi();
if (routes.length === 0) {
  fail(`${APP_DIR} 에서 \`${NEEDLE}\` 를 쓰는 page.tsx 를 하나도 못 찾았다 — ` +
    "탐지가 고장 났거나 라우트 구조가 바뀌었다. 통과시키지 않는다.");
}

const markers = parseRouteTable(readFileSync(logPath, "utf8"));
if (markers.size === 0) {
  fail("빌드 로그에서 라우트 표를 못 찾았다. `next build` 출력 형식이 바뀌었는지 본다.");
}

const problems = [];
for (const route of routes) {
  const marker = markers.get(route);

  if (marker === undefined) {
    problems.push(`${route} — 빌드 표에 없다 (라우트 경로 계산이 틀렸을 수 있다)`);
  } else if (marker !== "ƒ") {
    problems.push(`${route} — \`${marker}\` 로 프리렌더됐다. \`ƒ\` 여야 한다`);
  }
}

if (problems.length > 0) {
  fail(
    `\`${NEEDLE}\` 를 쓰는 라우트가 정적 프리렌더됐다 — 빌드한 주의 날짜가 굳는다 ` +
      "(`decisions.md` 4.31).\n" +
      problems.map((p) => `  · ${p}`).join("\n") +
      "\n\n해당 page.tsx 에 `export const dynamic = \"force-dynamic\"` 을 붙이거나, " +
      "`cookies()`/`searchParams` 를 읽어 동적으로 만든다.",
  );
}

console.log(`✓ ${NEEDLE} 라우트 ${routes.length}개가 전부 동적이다: ${routes.join(", ")}`);

/* ── 내부 ───────────────────────────────────────────────── */

function routesUsingEventApi() {
  const found = [];

  for (const file of walk(APP_DIR)) {
    if (!file.endsWith(`${sep}page.tsx`)) continue;
    if (!readFileSync(file, "utf8").includes(NEEDLE)) continue;
    found.push(toRoutePath(file));
  }

  return found.sort();
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

/** `src/app/(main)/explore/page.tsx` → `/explore`. 라우트 그룹 `(main)` 은 URL 에 안 남는다 */
function toRoutePath(file) {
  const segments = relative(APP_DIR, file)
    .split(sep)
    .slice(0, -1)
    .filter((segment) => !/^\(.*\)$/.test(segment));

  return segments.length === 0 ? "/" : `/${segments.join("/")}`;
}

function parseRouteTable(log) {
  const markers = new Map();

  for (const line of log.split("\n")) {
    const match = ROUTE_LINE.exec(line.trim());
    if (match) markers.set(match[2], match[1]);
  }

  return markers;
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}
