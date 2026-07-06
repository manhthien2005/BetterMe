import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import remotionPlugin from "@remotion/eslint-plugin";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname
});

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
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/remotion/**/*.{ts,tsx}"],
    ...remotionPlugin.flatPlugin
  }
];

export default eslintConfig;
