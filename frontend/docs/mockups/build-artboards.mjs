/**
 * 목업 .dc.html 한 파일에 든 화면 여러 개를 화면당 아트보드 하나로 펼친다.
 *
 * 원본은 우하단 플로팅 탭바로 화면을 전환하는 프로토타입이다(00-index 2번 원칙).
 * 캔버스는 파일 단위로 프레임을 만들기 때문에 그대로 올리면 45화면이 12프레임에 숨는다.
 * 그래서 화면마다 사본을 떠서 ① 초기 화면을 고정하고 ② 플로팅 탭바를 뗀다.
 *
 *   node build-artboards.mjs      → .build/ 에 45개 + canvas.json
<<<<<<< Updated upstream
=======
 *   node serve.mjs .build         → http://localhost:4173 로 확인
>>>>>>> Stashed changes
 *
 * ⚠️ `UserV2` 의 하단 탭은 제품의 실제 4탭 내비라 떼지 않는다. `Onboarding` 은
 *    플로팅 탭바가 없고 플로우 버튼으로 넘어간다.
 */
import fs from "node:fs";
import path from "node:path";

const SRC = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1"));
const OUT = path.join(SRC, ".build");

/** 파일 → 화면 id → 아트보드 제목. 순서가 캔버스 배치 순서다. */
const SCREENS = {
  Onboarding: { login: "온보딩 — 로그인", terms: "온보딩 — 약관 동의", intro: "온보딩 — 인트로", profile: "온보딩 — 프로필 설정", done: "온보딩 — 완료" },
  UserV2: { home: "홈", explore: "탐색", saved: "찜", my: "마이" },
  Actions: { detail: "소개팅 상세", compare: "비교함", saved: "찜 목록" },
  My: { notis: "알림함", settings: "알림 설정", reviews: "내 후기", write: "후기 작성", my: "마이페이지" },
  Support: { search: "검색", location: "위치 권한", states: "빈 상태 · 에러" },
  Admin: { login: "ADMIN — 로그인", dash: "ADMIN — 대시보드", invite: "ADMIN — 계정 발급", list: "ADMIN — 검수 목록", detail: "ADMIN — 검수 상세" },
  AdminManage: { providers: "ADMIN — 주최사", members: "ADMIN — 멤버", reviews: "ADMIN — 후기", report: "ADMIN — 신고", logs: "ADMIN — 로그" },
  Provider: { login: "PROVIDER — 로그인", setpw: "PROVIDER — 비밀번호 설정", dash: "PROVIDER — 대시보드", create: "PROVIDER — 소개팅 등록" },
  ProviderManage: { edit: "PROVIDER — 수정", seats: "PROVIDER — 정원", stats: "PROVIDER — 통계", contract: "PROVIDER — 계약", account: "PROVIDER — 계정" },
  Common: { splash: "스플래시", redirect: "리다이렉트", error: "에러", maintenance: "점검" },
};

<<<<<<< Updated upstream
=======
/**
 * 앞선 화면에서 담아야 내용이 생기는 화면의 초기 상태를 대신 채운다.
 *
 * 비교함은 상세의 `비교 담기` 를 눌러야 차는데 탭바를 떼면 그 경로가 없다.
 * 시드를 안 주면 아트보드가 빈 상태만 보여준다 (2026-09-10 확인).
 */
const SEED = {
  "Actions.compare": { compareIds: "[1, 2, 3]" },
};

>>>>>>> Stashed changes
/** 화면이 하나뿐이라 그대로 나르는 파일 */
const SINGLE = {
  Main: "주최사 소개 /providers/[id]",
  ProviderReviews: "주최사 후기 /providers/[id]/reviews",
};

/** 하단 탭이 제품 기능이라 떼지 않는 파일 */
const KEEP_TABBAR = new Set(["UserV2"]);

const PAGES = [
  { id: "page-1", name: "USER", files: ["Onboarding", "UserV2", "Actions", "My", "Support", "Main", "ProviderReviews"] },
  { id: "page-2", name: "ADMIN · PROVIDER", files: ["Admin", "AdminManage", "Provider", "ProviderManage"] },
  { id: "page-3", name: "공통", files: ["Common"] },
];

const COLS = 6;
const W = 430;
const H = 1820;
const GAP_X = 120;
const GAP_Y = 150;

<<<<<<< Updated upstream
/** `state = { … screen: 'x' … }` 의 초기값만 바꾼다 — go* 핸들러는 건드리지 않는다 */
function setInitialScreen(src, screen) {
  const at = src.indexOf("state = {");
  if (at < 0) throw new Error("state 초기화를 찾지 못했다");
  const head = src.slice(at, at + 300);
  if (!/screen:\s*'[a-zA-Z0-9_]+'/.test(head)) throw new Error("screen 초기값을 찾지 못했다");
  const replaced = head.replace(/screen:\s*'[a-zA-Z0-9_]+'/, `screen: '${screen}'`);
  return src.slice(0, at) + replaced + src.slice(at + 300);
=======
/** `state = { … }` 초기화 블록의 필드 하나만 바꾼다 — go* 핸들러는 건드리지 않는다 */
function setStateField(src, key, valueSrc) {
  const at = src.indexOf("state = {");
  if (at < 0) throw new Error("state 초기화를 찾지 못했다");
  const WINDOW = 600;
  const head = src.slice(at, at + WINDOW);
  const re = new RegExp(`(\\b${key}:\\s*)([^,}\\n]+)`);
  if (!re.test(head)) throw new Error(`state.${key} 를 초기화 블록에서 찾지 못했다`);
  return src.slice(0, at) + head.replace(re, `$1${valueSrc}`) + src.slice(at + WINDOW);
>>>>>>> Stashed changes
}

/** 우하단 플로팅 탭바 `<div …position:fixed;bottom:Npx;right:Npx…>` 를 통째로 걷어낸다 */
function stripTabBar(src) {
  const m = /<div style="position:fixed;bottom:\d+px;right:\d+px;[^"]*">/.exec(src);
  if (!m) return { out: src, removed: false };
  let i = m.index + m[0].length;
  let depth = 1;
  while (depth > 0) {
    const open = src.indexOf("<div", i);
    const close = src.indexOf("</div>", i);
    if (close < 0) throw new Error("탭바의 닫는 태그를 찾지 못했다");
    if (open >= 0 && open < close) { depth++; i = open + 4; }
    else { depth--; i = close + 6; }
  }
  return { out: src.slice(0, m.index) + src.slice(i), removed: true };
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

<<<<<<< Updated upstream
const made = new Map(); // 원본 파일 → [{file, title}]
let stripped = 0;
=======
const made = new Map();
let stripped = 0;
let seeded = 0;
>>>>>>> Stashed changes

for (const [name, screens] of Object.entries(SCREENS)) {
  const src = fs.readFileSync(path.join(SRC, `${name}.dc.html`), "utf8");
  const list = [];
  for (const [id, title] of Object.entries(screens)) {
<<<<<<< Updated upstream
    let out = setInitialScreen(src, id);
=======
    let out = setStateField(src, "screen", `'${id}'`);
    for (const [key, value] of Object.entries(SEED[`${name}.${id}`] ?? {})) {
      out = setStateField(out, key, value);
      seeded++;
    }
>>>>>>> Stashed changes
    if (!KEEP_TABBAR.has(name)) {
      const r = stripTabBar(out);
      out = r.out;
      if (r.removed) stripped++;
    }
    const file = `${name}${id[0].toUpperCase()}${id.slice(1)}.dc.html`;
    fs.writeFileSync(path.join(OUT, file), out);
    list.push({ file, title });
  }
  made.set(name, list);
}

for (const [name, title] of Object.entries(SINGLE)) {
  const file = `${name}.dc.html`;
  fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
  made.set(name, [{ file, title }]);
}

<<<<<<< Updated upstream
// 진입 아트보드는 Main.dc.html 이어야 한다 — 이미 SINGLE 에 있다
=======
// 로컬 확인용 — .dc.html 은 같은 폴더의 support.js 를 상대경로로 문다
fs.copyFileSync(path.join(SRC, "support.js"), path.join(OUT, "support.js"));

>>>>>>> Stashed changes
const artboards = [];
for (const page of PAGES) {
  let i = 0;
  for (const name of page.files) {
    for (const { file, title } of made.get(name)) {
      artboards.push({
        file, title, page: page.id,
        x: (i % COLS) * (W + GAP_X),
        y: Math.floor(i / COLS) * (H + GAP_Y),
        w: W, h: H, is_interactive: true,
      });
      i++;
    }
  }
}

const canvas = {
  pages: PAGES.map(({ id, name }) => ({ id, name })),
  artboards,
  annotations: [
    { id: "note-user", page: "page-1", x: 0, y: -190, w: 1600,
      text: "화면 하나에 아트보드 하나다. 원본 .dc.html 은 파일 하나에 3~5화면을 담고 우하단 플로팅 탭바로 전환하는데, 그 탭바는 프로토타입 장치이지 제품 기능이 아니라(00-index 2번) 여기서는 떼어냈다.\n\n예외 — 홈·탐색·찜·마이의 하단 4탭은 제품의 실제 내비게이션이라 남겼다.\n\n⚠️ 사양과 어긋난 자리: 탐색 카드가 삭제된 축인 category(와인·전시·러닝…)를 사진 라벨로 아직 쓴다 · 탐색 정렬에 '평점 높은순'·'가격 높은순'이 없다 · 내 후기에 평점 요약 블록이 붙어 있다(10.4 에서 /my/reviews 는 요약 없음으로 갈렸다)." },
    { id: "note-admin", page: "page-2", x: 0, y: -190, w: 1600,
      text: "이 화면들의 기능정의는 아직 spec/ 에 없다 — 기능정의서가 USER 한정 문서라서다. 백엔드 기능정의서의 쓰기 경로(주최사 등록·검수·계정 발급·정원·계약)가 여기 다 들어 있다." },
  ],
  launch: { view: "canvas", page: "page-1" },
};

fs.writeFileSync(path.join(OUT, "canvas.json"), JSON.stringify(canvas, null, 2) + "\n");

<<<<<<< Updated upstream
console.log(`${artboards.length}개 아트보드 · 탭바 제거 ${stripped}개 · ${OUT}`);
=======
console.log(`${artboards.length}개 아트보드 · 탭바 제거 ${stripped} · 상태 시드 ${seeded} · ${OUT}`);
>>>>>>> Stashed changes
for (const page of PAGES) {
  console.log(`  ${page.name}: ${artboards.filter((a) => a.page === page.id).length}개`);
}
