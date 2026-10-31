import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import remotionPlugin from "@remotion/eslint-plugin";

const eslintConfig = [
  {
    ignores: [
      ".agents/**",
      ".claude/**",
      ".next/**",
      "_tmp_*",
      "code.js",
      "coverage/**",
      "next-env.d.ts",
      "node_modules/**",
      "out/**",
      "playwright-report/**",
      "test-results/**",
      ".worktrees/**"
    ]
  },
  ...nextVitals,
  ...nextTypescript,
  {
    files: ["src/remotion/**/*.{ts,tsx}"],
    ...remotionPlugin.flatPlugin
  }
];

export default eslintConfig;
