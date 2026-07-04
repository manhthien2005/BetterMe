import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname
});

const eslintConfig = [
  {
    ignores: [
      ".agents/**",
      ".next/**",
      ".worktrees/**",
      "code.js",
      "coverage/**",
      "next-env.d.ts",
      "node_modules/**",
      "playwright-report/**",
      "test-results/**"
    ]
  },
  ...compat.config({
    extends: ["next/core-web-vitals", "next/typescript"]
  }),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ]
    }
  }
];

export default eslintConfig;
