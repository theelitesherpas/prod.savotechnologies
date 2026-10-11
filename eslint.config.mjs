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
    // Local dev tooling:
    "scripts/**",
    ".impeccable/**",
    // Generated/manual review artifacts are not application source.
    "tmp/**",
    "tmp-benchmark/**",
    "tmp-*.mjs",
  ]),
]);

export default eslintConfig;
