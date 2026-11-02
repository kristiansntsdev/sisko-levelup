import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // /demo-preview contains generated copies of real screens (scripts/gen-demo-preview.mjs), which carry their own
  // eslint-disable comments from the originals; don't warn about directives that no longer apply.
  {
    files: ["app/demo-preview/**", "components/demo-preview/**"],
    linterOptions: { reportUnusedDisableDirectives: "off" },
  },
]);

export default eslintConfig;
