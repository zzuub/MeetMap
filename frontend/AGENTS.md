<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:meetmap-project-rules -->
## 위 지침을 이 프로젝트에서 적용하는 법

`node_modules/next/dist/docs/` 에는 **md 파일이 452개** 있고 큰 것은 40~60KB 다.
"관련 가이드를 읽어라"를 넓게 해석해 훑으면 코드도 쓰기 전에 세션 예산이 사라진다.

**먼저**: 이 프로젝트가 실제로 부딪힌 Next 16 차이는 세 가지뿐이고, 이미
[`docs/session-handoff.md`](docs/session-handoff.md) 4장에 정리돼 있다 — `proxy.ts`(구 `middleware.ts`),
Promise 가 된 `params`/`searchParams`/`cookies()`, Turbopack 기본. 대부분은 이걸로 끝난다.

**문서를 여는 조건**: 위 셋 밖의 API 를 처음 쓰는데 시그니처가 확실치 않을 때 **그때만**.
이때도 **파일 하나만** 연다. 디렉터리를 훑지 않는다.

| 찾는 것 | 경로 |
| --- | --- |
| 함수 (`cookies` `headers` `fetch` `revalidate*` …) | `01-app/03-api-reference/04-functions/<이름>.md` |
| 컴포넌트 (`image` `link` `form` …) | `01-app/03-api-reference/02-components/<이름>.md` |
| 파일 규약 (`page` `layout` `route` `proxy` …) | `01-app/03-api-reference/03-file-conventions/<이름>.md` |
| `next.config` 옵션 | `01-app/03-api-reference/05-config/01-next-config-js/<이름>.md` |

`02-guides/` 는 마이그레이션·튜토리얼이라 길다. **문제를 특정하지 못한 채로 열지 않는다.**
<!-- END:meetmap-project-rules -->
