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

/**
 * 슬라이스 내부 파일을 건너뛰고 직접 임포트하는 것을 막는다. 각 폴더는 `index.ts`
 * 로만 공개한다 (src/README.md).
 *
 * ⚠️ **`no-restricted-imports` 를 별도 블록으로 추가하지 않는다.** flat config 는
 * 같은 규칙을 뒤 블록이 **덮어쓰므로**, `src/widgets/**` 에 배럴 블록을 따로 두면
 * 레이어 경계 규칙이 조용히 사라진다. 그래서 패턴을 합쳐 한 규칙으로 넘긴다
 * (`decisions.md` 4.38).
 */
const barrelPatterns = [
  {
    group: [
      "@/entities/*/model/*",
      "@/entities/*/api/*",
      "@/entities/*/mock/*",
      "@/entities/*/ui/*",
      "@/features/*/model/*",
      "@/features/*/api/*",
      "@/features/*/ui/*",
      "@/widgets/*/model/*",
      "@/widgets/*/ui/*",
    ],
    message:
      "슬라이스 내부 파일을 직접 임포트하지 마세요. 공개 API(index.ts)를 통해 가져오세요.",
  },
  {
    group: ["@/shared/ui/*", "@/shared/lib/*", "@/shared/api/*"],
    message: "배럴을 사용하세요: @/shared/ui, @/shared/lib, @/shared/api",
  },
];

const layerBoundaryRules = LAYERS.filter((layer) => layer !== "app").map(
  (layer) => ({
    files: [`src/${layer}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...forbiddenFor(layer).map((forbidden) => ({
              group: [`@/${forbidden}/*`],
              message:
                `FSD 레이어 위반: ${layer} 는 ${forbidden} 를 임포트할 수 없습니다. ` +
                `허용 방향은 app → widgets → features → entities → shared 입니다. ` +
                `(같은 레이어의 다른 슬라이스가 필요하면 상위 레이어에서 조립하세요.)`,
            })),
            ...barrelPatterns,
          ],
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
    // `app` 은 레이어 규칙 대상이 아니라(위 filter) 배럴 패턴만 따로 건다.
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: barrelPatterns }],
    },
  },
  {
    /**
     * 결제 비대행 고지(7.3)를 우회하는 경로를 **린트가 막는다.**
     *
     * `externalApplyUrl` 은 `EventDetail` 의 평범한 문자열 필드라, 모달을 import
     * 하지 않고도 아무 컴포넌트나 `<a href={event.externalApplyUrl}>` 를 쓸 수 있다
     * (PR #30 리뷰). 배럴 규칙으로는 이 경로가 안 막히므로 **필드 접근 자체**를
     * 슬라이스 밖에서 금지한다 (`decisions.md` 4.38).
     *
     * 목·타입 선언은 `Property`/`TSPropertySignature` 라 이 선택자에 안 걸린다.
     */
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/features/event-apply/**"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[property.name='externalApplyUrl']",
          message:
            "외부 신청 URL 을 직접 읽지 마세요 — 7.3 확인 모달을 우회하는 경로가 됩니다. " +
            "`features/event-apply` 의 `ApplyButton` 을 쓰세요 (decisions.md 4.32·4.38).",
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
