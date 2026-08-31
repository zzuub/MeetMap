import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * 단위 테스트 설정.
 *
 * 현재 대상은 **부수효과 없는 순수 함수**뿐이라 DOM 이 필요 없다.
 * 따라서 `environment` 는 기본값(node)을 쓰고 jsdom 을 붙이지 않는다 —
 * 실행이 빠르고 의존성도 줄어든다.
 *
 * React 컴포넌트 테스트가 필요해지면 그때 `jsdom` + `@testing-library/react` 를
 * 추가하고 `environmentMatchGlobs` 로 파일별로 나눈다. 지금 미리 깔면
 * 쓰지도 않는 의존성만 늘어난다.
 */
export default defineConfig({
  resolve: {
    alias: {
      // tsconfig 의 `"@/*": ["./src/*"]` 와 같은 매핑.
      // vite-tsconfig-paths 를 쓰면 자동이지만, 별칭이 하나뿐이라
      // 의존성을 늘리지 않고 직접 적는다.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // describe/it/expect 를 각 파일에서 명시적으로 import 한다.
    // 전역 주입을 쓰면 tsconfig 에 vitest 타입을 추가해야 하고,
    // 어떤 함수가 어디서 왔는지 코드만 봐서는 알 수 없다.
    globals: false,
  },
});
