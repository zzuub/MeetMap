import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * FSD 레이어 경계 (src/README.md).
 *
 *   app → widgets → features → entities → shared
 *
 * 이 방향으로만 import 할 수 있다. 역방향과 동일 레이어 간 참조는 금지다.
 * 문서로만 두면 지켜지지 않으므로 린트로 막는다.
 *
 * 동일 레이어 참조 금지의 예외: 자기 슬라이스 내부의 상대 경로 import
 * (`./model/types`)는 `@/` 별칭을 쓰지 않으므로 이 규칙에 걸리지 않는다.
 */
const LAYERS = ["shared", "entities", "features", "widgets", "app"];

/** 해당 레이어에서 임포트가 금지되는 레이어들 (자기 자신 + 상위 전부) */
function forbiddenFor(layer) {
  const index = LAYERS.indexOf(layer);
  return LAYERS.slice(index);
}

const layerBoundaryRules = LAYERS.filter((layer) => layer !== "app").map(
  (layer) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: forbiddenFor(layer).map((forbidden) => ({
            group: [`@/${forbidden}/*`],
            message:
              `FSD 레이어 위반: ${layer} 는 ${forbidden} 를 임포트할 수 없습니다. ` +
              `허용 방향은 app → widgets → features → entities → shared 입니다. ` +
              `(같은 레이어의 다른 슬라이스가 필요하면 상위 레이어에서 조립하세요.)`,
          })),
        },
      ],
    },
  }),
);

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...layerBoundaryRules,
  {
    // 슬라이스 내부 파일을 건너뛰고 직접 임포트하는 것을 막는다.
    // 각 폴더는 index.ts 로만 공개한다 (src/README.md).
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/entities/*/model/*", "@/entities/*/api/*", "@/entities/*/mock/*"],
              message:
                "슬라이스 내부 파일을 직접 임포트하지 마세요. 공개 API(index.ts)를 통해 가져오세요.",
            },
            {
              group: ["@/shared/ui/*", "@/shared/lib/*", "@/shared/api/*"],
              message:
                "배럴을 사용하세요: @/shared/ui, @/shared/lib, @/shared/api",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
