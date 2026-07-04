import { existsSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();

function readRequiredJson(path: string): Record<string, unknown> {
  expect(existsSync(path), `${relative(root, path)} must exist`).toBe(true);
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

describe("T-001 toolchain", () => {
  it("defines every required project script", () => {
    const manifest = readRequiredJson(join(root, "package.json"));
    const scripts = manifest.scripts as Record<string, string>;

    expect(manifest.packageManager).toMatch(/^pnpm@/);
    expect(scripts).toMatchObject({
      dev: "next dev",
      build: "next build",
      lint: "eslint .",
      typecheck: "tsc --noEmit",
      test: "vitest run",
      "test:e2e": "playwright test"
    });
  });

  it("provides the required Next, test, lint, and CSS configuration files", () => {
    const requiredFiles = [
      "next-env.d.ts",
      "next.config.ts",
      "vitest.config.ts",
      "playwright.config.ts",
      "eslint.config.mjs",
      "postcss.config.mjs",
      "tailwind.config.ts"
    ];

    for (const file of requiredFiles) {
      expect(existsSync(join(root, file)), `${file} must exist`).toBe(true);
    }
  });

  it("type-checks the complete Next.js project instead of a hand-picked subset", () => {
    const config = readRequiredJson(join(root, "tsconfig.json"));

    expect(config.include).toEqual([
      "next-env.d.ts",
      ".next/types/**/*.ts",
      "**/*.ts",
      "**/*.tsx"
    ]);
    expect(config.exclude).toEqual(["node_modules"]);
  });

  it("allows only the native dependency build scripts required by the toolchain", () => {
    const workspacePath = join(root, "pnpm-workspace.yaml");

    expect(existsSync(workspacePath), "pnpm-workspace.yaml must exist").toBe(true);

    const workspace = readFileSync(workspacePath, "utf8");
    expect(workspace).toContain("allowBuilds:");
    expect(workspace).toContain("  esbuild: true");
    expect(workspace).toContain("  sharp: true");
    expect(workspace).toContain("  unrs-resolver: true");
  });
});
