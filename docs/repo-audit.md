# BetterMe Repository Audit

Audit date: 2026-07-04

## Framework state

- `package.json` does not exist, so the installed or intended Next.js version cannot be verified.
- The source layout and imports identify a TypeScript Next.js App Router prototype: routes live under `src/app/`, pages use `next/navigation`, and server code uses `next/headers` and server actions. There is no Pages Router directory.
- At audit start, no `tsconfig.json`, `next.config.*`, `next-env.d.ts`, lint configuration, test configuration, or test files were present. This planning session adds a strict scaffold-only `tsconfig.json` so the new canonical placeholders can be checked without pretending the dependency-less prototype is buildable; Next/test/lint configuration remains absent for T-001.
- No `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock` exists. A package manager therefore cannot be inferred. Node 24.16.0, npm 11.13.0, and pnpm 11.7.0 are available in the environment, but none is established by the repository.
- Existing imports indicate unversioned dependency intent for Next.js/React, Supabase SSR, TanStack Query, Radix UI primitives, Lucide, Sonner, `class-variance-authority`, `clsx`, and `tailwind-merge`. These are not confirmed installed dependencies because neither a manifest nor `node_modules/` exists.
- Tailwind directives and utility classes exist in the source, but no Tailwind or PostCSS configuration is present.

## Existing structure and conflicts

The repository already contains a partial BetterMe prototype rather than an empty scaffold:

- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/dashboard/`, `src/app/login/`, and `src/app/auth/` contain implemented App Router code.
- `src/components/ui/`, `src/components/dashboard/`, `src/components/auth/`, and `src/components/query-provider.tsx` contain implemented React components. `src/app/dashboard/page.tsx` imports `src/components/dashboard/dashboard-client.tsx`, but that file is missing.
- `src/lib/tracker.ts`, `src/lib/date.ts`, `src/lib/defaults.ts`, `src/lib/optimistic.ts`, and `src/lib/types.ts` contain implemented tracker/domain logic and prototype types.
- `src/lib/server/`, `src/lib/supabase/`, `src/middleware.ts`, `supabase/schema.sql`, and `.env.example` implement or support login, multi-user storage, and Supabase. Those concerns are explicitly outside the newly requested Phase 1 scope.
- `public/manifest.json` defines a PWA manifest.
- `code.js` is the complete 1,797-line Google Apps Script legacy source and is the authoritative legacy reference for this planning pass.
- No `docs/` directory existed before this audit.

No existing files were deleted or overwritten. Existing implemented files are treated as a prototype to reconcile in a future implementation task, not as the target architecture for this planning session.

## Superpowers install location

Superpowers is installed at `.agents/skills/`. The installed skills are:

- `brainstorming`
- `dispatching-parallel-agents`
- `executing-plans`
- `finishing-a-development-branch`
- `receiving-code-review`
- `requesting-code-review`
- `subagent-driven-development`
- `systematic-debugging`
- `test-driven-development`
- `using-git-worktrees`
- `using-superpowers`
- `verification-before-completion`
- `writing-plans`
- `writing-skills`

This session uses `using-superpowers`, `brainstorming`, `writing-plans`, and—at the final gate—`verification-before-completion`. Implementation skills are deferred.

## Git state

A `.git/` directory exists but is empty and does not contain repository metadata. `git branch --show-current`, `git status`, and `git log` all fail with “not a git repository.” The current branch and clean/dirty state are therefore unavailable. No branch, worktree, commit, or push operation will be attempted in this session.

## Decision log

1. Preserve the existing prototype unchanged. In particular, do not replace the implemented root layout, root page, global CSS, dashboard page, UI primitives, Supabase modules, or legacy domain modules with stubs.
2. Add the requested planning architecture alongside the prototype in new paths: canonical Phase 1 types in `src/types/`, pure-domain placeholders in `src/lib/scoring/` and `src/lib/date/`, adapters in `src/lib/storage/`, chart transforms in `src/charts/`, theme definitions in `src/themes/`, and feature/page placeholders in their requested directories.
3. Add missing App Router page stubs for `tracker`, `calendar`, `habits`, and `settings`. Retain the existing implemented dashboard route and document its reconciliation as an implementation task.
4. Keep existing `src/lib/date.ts`, `src/lib/types.ts`, Supabase/auth code, and other prototype modules visible but outside the canonical Phase 1 boundaries. The future migration task will either adapt or retire them after tests exist; this session will not refactor them.
5. Because there is no package manifest or lockfile, do not invent project dependency versions or run a project install during planning. Add a self-contained strict `tsconfig.json` that includes only the new canonical scaffold plus the compatibility dashboard stub, and use a temporary compiler runtime for verification. Inability to verify the existing prototype as a Next build is a repository risk, not permission to implement missing product code.
6. Treat that `tsconfig.json` as a planning-only gate. T-001 must replace it with the standard project-wide Next.js include list; T-002, rather than TypeScript file omission, enforces the canonical/prototype boundary.
7. Do not run `git init` implicitly. Restoring or initializing the empty `.git/` directory is an explicit user-approved prerequisite before worktrees or implementation tasks.
