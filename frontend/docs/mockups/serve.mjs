/**
 * 목업을 로컬 브라우저에서 보기 위한 최소 정적 서버.
 *
 * `.dc.html` 은 같은 폴더의 `support.js` 를 상대경로로 물기 때문에 `file://` 로 열면
 * 런타임이 안 붙어 `{{ }}` 자리표시자가 그대로 보인다. http 로 띄워야 제대로 렌더된다.
 *
 *   node serve.mjs            → 원본 12개를 4173 포트로
 *   node serve.mjs .build     → 화면별로 펼친 45개를
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), process.argv[2] ?? ".");
const PORT = Number(process.env.PORT ?? 4173);
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png" };

http
  .createServer((req, res) => {
    const rel = decodeURIComponent(new URL(req.url, "http://x").pathname);

    if (rel === "/") {
      const files = fs.readdirSync(ROOT).filter((f) => f.endsWith(".dc.html")).sort();
      const links = files.map((f) => `<li><a href="./${encodeURIComponent(f)}">${f}</a></li>`).join("");
      res.writeHead(200, { "content-type": TYPES[".html"] });
      res.end(`<meta charset="utf-8"><title>목업 ${files.length}개</title><h1>목업 ${files.length}개</h1><ul>${links}</ul>`);
      return;
    }

    // ROOT 밖으로 나가는 경로는 받지 않는다
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end("not found");
      return;
    }

    res.writeHead(200, { "content-type": TYPES[path.extname(file)] ?? "application/octet-stream" });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`${ROOT} → http://localhost:${PORT}`));
