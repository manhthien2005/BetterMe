import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import ts from "typescript";

const root = process.cwd();

const canonicalDirectories = [
  "src/types",
  "src/data",
  "src/lib/scoring",
  "src/lib/date",
  "src/lib/storage",
  "src/lib/utils",
  "src/charts",
  "src/themes",
  "src/store",
  "src/hooks",
  "src/features",
  "src/components/layout",
  "src/components/tracker",
  "src/components/calendar",
  "src/components/habits",
  "src/components/charts",
  "src/components/theme",
  "src/components/feedback"
];

const canonicalFiles = [
  "src/app/layout.tsx",
  "src/app/page.tsx",
  "src/app/tracker/page.tsx",
  "src/app/calendar/page.tsx",
  "src/app/habits/page.tsx",
  "src/app/settings/page.tsx",
  "src/components/dashboard/dashboard-client.tsx",
  "src/components/dashboard/dashboard-overview.tsx"
];

const forbiddenDirectories = [
  "src/lib/supabase",
  "src/lib/server",
  "src/components/auth"
].map((path) => resolve(root, path));

const forbiddenFiles = [
  "src/lib/tracker.ts",
  "src/lib/date.ts",
  "src/lib/types.ts"
].map((path) => resolve(root, path));

function collectSourceFiles(path: string): string[] {
  if (!existsSync(path)) return [];
  if (statSync(path).isFile()) return [path];

  return readdirSync(path).flatMap((entry) => collectSourceFiles(join(path, entry)));
}

function isSourceFile(path: string): boolean {
  return [".ts", ".tsx", ".js", ".jsx"].includes(extname(path)) && !path.endsWith(".d.ts");
}

function importSpecifiers(path: string): string[] {
  const source = readFileSync(path, "utf8");
  const scriptKind = path.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const file = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, scriptKind);
  const specifiers: string[] = [];

  file.forEachChild((node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      specifiers.push(node.moduleSpecifier.text);
    }
  });

  return specifiers;
}

function resolveProjectImport(importer: string, specifier: string): string | null {
  if (specifier.startsWith("@/")) return resolve(root, "src", specifier.slice(2));
  if (specifier.startsWith(".")) return resolve(dirname(importer), specifier);
  return null;
}

function targetsForbiddenModule(target: string): boolean {
  const normalized = resolve(target);

  if (
    forbiddenDirectories.some(
      (directory) => normalized === directory || normalized.startsWith(`${directory}${sep}`)
    )
  ) {
    return true;
  }

  return forbiddenFiles.some((file) => normalized === file || `${normalized}.ts` === file);
}

describe("canonical/prototype import boundary", () => {
  it("keeps canonical modules independent from prototype auth, server, and domain code", () => {
    const files = [
      ...canonicalDirectories.flatMap((path) => collectSourceFiles(resolve(root, path))),
      ...canonicalFiles.map((path) => resolve(root, path))
    ].filter(isSourceFile);
    const violations = files.flatMap((file) =>
      importSpecifiers(file)
        .map((specifier) => ({ specifier, target: resolveProjectImport(file, specifier) }))
        .filter(
          (item): item is { specifier: string; target: string } =>
            item.target !== null && targetsForbiddenModule(item.target)
        )
        .map((item) => `${relative(root, file)} imports ${item.specifier}`)
    );

    expect(violations).toEqual([]);
  });

  it("keeps the root layout free of prototype client providers", () => {
    const layout = readFileSync(resolve(root, "src/app/layout.tsx"), "utf8");

    expect(layout).not.toContain("@/components/query-provider");
    expect(layout).not.toContain("@/components/ui/toaster");
    expect(layout).not.toContain("@/components/ui/tooltip");
  });

  it("routes the local-first entry directly to the dashboard without auth", () => {
    const page = readFileSync(resolve(root, "src/app/page.tsx"), "utf8");

    expect(page).toContain('redirect("/en/dashboard")');
    expect(page).not.toContain("supabase");
    expect(page).not.toContain('"/login"');
  });

  it("records every temporary prototype exclusion for later reconciliation", () => {
    expect(existsSync(resolve(root, "docs/prototype-reconciliation.md"))).toBe(true);
  });
});
